#!/usr/bin/env python3
"""Offline design validation. Does not modify the playable game or save states.
Run: python scripts/trade_balance.py > docs/trade-validation-data.json
"""
from pathlib import Path
import json
import math
import random

ROOT = Path(__file__).resolve().parents[1]
ROLE = {'Export': .70, 'Neutral': 1., 'Import': 1.40}
TARGET = {'Export': 4000., 'Neutral': 2000., 'Import': 1000.}
RECOVERY = {'Export': 5., 'Neutral': 7., 'Import': 10.}
PORTS = {'Bridgetown': (0, 0), 'Saint-Pierre': (-29, 50), 'Willemstad': (-285, -25)}
SHIPS = {
    'Sloop': {'speed': 1.2, 'space': 300, 'weight': 500, 'crew': 10, 'cannons': 4},
    'Fluyt': {'speed': 1., 'space': 900, 'weight': 1300, 'crew': 16, 'cannons': 4},
}

def goods():
    text = (ROOT / 'docs/trade-release-draft.md').read_text()
    section = text.split('## Draft goods values')[1].split('## Draft stock profiles')[0]
    result = {}
    for line in section.splitlines():
        fields = [x.strip() for x in line.strip('|').split('|')]
        if len(fields) != 5:
            continue
        try:
            price, space, weight = map(float, fields[2:])
        except ValueError:
            continue
        result[fields[1]] = dict(category=fields[0], price=price, space=space, weight=weight)
    assert len(result) == 45
    return result

GOODS = goods()

def spread(tier):
    return max(.05, .15 - .01 * tier)

def integral(low, high, target):
    """Exact integral of the piecewise-linear clamped scarcity curve."""
    assert high >= low >= 0 and target > 0
    cuts = [low] + [x for x in (target * -.25, target * 1.875) if low < x < high] + [high]
    value = 0.
    for a, b in zip(cuts, cuts[1:]):
        value += (b-a)*max(.65, min(1.5, 1.4-.4*(a+b)/2/target))
    return value

def quote(base, role, stock, target, quantity, side, tier=0):
    maximum = target * 2
    if quantity < 0 or (side == 'buy' and quantity > stock+1e-8) or (side == 'sell' and stock+quantity > maximum+1e-8):
        raise ValueError('Stock/storage limit')
    if side not in ('buy', 'sell'):
        raise ValueError('Unknown side')
    low, high = (stock-quantity, stock) if side == 'buy' else (stock, stock+quantity)
    raw = base*ROLE[role]*integral(low, high, target)*(1+spread(tier) if side == 'buy' else 1-spread(tier))
    return math.ceil(raw-1e-8) if side == 'buy' else math.floor(raw+1e-8)

def recover(stock, target, days, tau):
    return target+(stock-target)*math.exp(-days/tau)

def market(name, role, rare_scale=.1):
    if name == 'Provisions':
        target, tau = 100000., 20.
    else:
        target = TARGET[role]*(rare_scale if GOODS[name]['category'] == 'Luxury' else 1)
        tau = RECOVERY[role]
    return dict(role=role, stock=target, target=target, tau=tau)

def check_invariants():
    count = 0
    for name, good in GOODS.items():
        for role in ROLE:
            m = market(name, role)
            for tier in (0, 5, 10):
                for fraction in (0, .1, .5, 1, 1.5, 1.875, 2):
                    s, t = m['target']*fraction, m['target']
                    for q in (1, 10, 50, 100, 500, 1000):
                        if q <= s:
                            paid = quote(good['price'], role, s, t, q, 'buy', tier)
                            received = quote(good['price'], role, s-q, t, q, 'sell', tier)
                            assert received <= paid, (name, role, tier, s, q)
                            first = q//2
                            split = quote(good['price'], role, s, t, first, 'buy', tier)+quote(good['price'], role, s-first, t, q-first, 'buy', tier)
                            assert split >= paid
                            count += 2
                        if q+s <= 2*t:
                            received = quote(good['price'], role, s, t, q, 'sell', tier)
                            paid = quote(good['price'], role, s+q, t, q, 'buy', tier)
                            assert paid >= received
                            first = q//2
                            split = quote(good['price'], role, s, t, first, 'sell', tier)+quote(good['price'], role, s+first, t, q-first, 'sell', tier)
                            assert split <= received
                            count += 2
    rng = random.Random(20260920)
    for _ in range(1000):
        target = rng.uniform(10, 100000)
        stock = rng.uniform(0, 2*target)
        a, b, tau = rng.random()*20, rng.random()*20, rng.uniform(2, 20)
        assert math.isclose(recover(recover(stock, target, a, tau), target, b, tau), recover(stock, target, a+b, tau), abs_tol=1e-7)
        count += 1
    for side, stock in [('buy', 0), ('sell', 2000)]:
        try:
            quote(10, 'Neutral', stock, 1000, 1, side)
            raise AssertionError('Missing stock limit')
        except ValueError:
            count += 1
    return count

def distance(a, b):
    return math.dist(PORTS[a], PORTS[b])

def voyage(ship, good, quantity, a, b, provisions, sailing_tier=0, passenger_count=0, freight=0, weather=1):
    spec = SHIPS[ship]
    weight = quantity*good['weight']+provisions*.25+spec['crew']+1+spec['cannons']*5+passenger_count+freight
    if quantity*good['space']+provisions+freight > spec['space']+1e-8 or weight > spec['weight']+1e-8:
        return None
    load = max(0, min(1, (weight/spec['weight']-.2)/.8))
    speed = spec['speed']*(1-.25*load)*(1+.05*sailing_tier)
    normal = math.ceil(distance(a,b)/speed)
    hours = math.ceil(normal*weather)
    recommended = math.ceil((math.ceil(normal*1.25)+24+4)*(spec['crew']+passenger_count)/24)
    if provisions < recommended:
        return None
    return hours, speed, weight

def best_trip(name, a, b, source, destination, capital=800, ship='Sloop', tier=0, sailing=0, weather=1, contracts=False):
    good, spec = GOODS[name], SHIPS[ship]
    provisions = 120 if distance(a,b)<100 else (180 if ship=='Sloop' else 400)
    people, freight = (3,40) if contracts else (0,0)
    fees = (round(20+distance(a,b)*1.04)+round(20+distance(a,b)*40*.0432)+round(30+distance(a,b)*3*.69)) if contracts else 0
    maxq = max(0, int(min(source['stock'], 2*destination['target']-destination['stock'], (spec['space']-provisions-freight)/good['space'], capital/max(.01, good['price']*.65*ROLE[source['role']]))))
    best = None
    for q in range(maxq+1):
        v = voyage(ship, good, q, a, b, provisions, sailing, people, freight, weather)
        if not v:
            continue
        hours, speed, weight = v
        total_hours = hours+(6 if contracts else 2) # Buy/sell plus three acceptances and one delivery.
        wages = total_hours*spec['crew']*2/24
        # Approximate consumed provisions at 1.15 silver; starting reserve is retained as working inventory.
        food_cost = math.ceil(total_hours*(spec['crew']+people)/24*1.15)
        cost = quote(good['price'],source['role'],source['stock'],source['target'],q,'buy',tier)
        extra_reserve_cost = math.ceil(max(0, provisions-120)*1.15)
        if cost+wages+extra_reserve_cost+100>capital:
            continue
        receipt = quote(good['price'],destination['role'],destination['stock'],destination['target'],q,'sell',tier)
        margin = receipt-cost
        net = margin+fees-wages-food_cost
        row = dict(good=name,origin=a,destination=b,ship=ship,trade_tier=tier,sailing_tier=sailing,capital=capital,quantity=q,buy=cost,sell=receipt,gross_margin=margin,contracts=fees,hours=total_hours,provisions_loaded=provisions,weight=round(weight,2),net=round(net,2),silver_per_day=round(net*24/total_hours,2))
        if best is None or row['net']>best['net']:
            best=row
    return best

def contract_only(a='Bridgetown',b='Saint-Pierre',weather=1):
    d=distance(a,b)
    v=voyage('Sloop',GOODS['Sugar'],0,a,b,120,passenger_count=3,freight=40,weather=weather)
    hours=v[0]+4
    revenue=round(20+d*1.04)+round(20+d*40*.0432)+round(30+d*3*.69)
    net=revenue-hours*20/24-math.ceil(hours*13/24*1.15)
    return dict(revenue=revenue,hours=hours,net=round(net,2),silver_per_day=round(net*24/hours,2))

def learning_margin(base, source_role, purchase_stock, source_target, destination_role, sale_stock, destination_target, quantity, buy_tier, sell_tier):
    """Prototype learning attribution, independent of cash-line rounding/basket boundaries."""
    return sum(max(0,
        base*ROLE[destination_role]*integral(sale_stock+i,sale_stock+i+1,destination_target)*(1-spread(sell_tier))
        -base*ROLE[source_role]*integral(purchase_stock-i-1,purchase_stock-i,source_target)*(1+spread(buy_tier))
    ) for i in range(quantity))

def round_trips(return_role='Import',dynamic_skills=True,legs=12):
    markets={('Bridgetown','Sugar'):market('Sugar','Export'),('Saint-Pierre','Sugar'):market('Sugar','Import'),('Saint-Pierre','Coffee'):market('Coffee','Export'),('Bridgetown','Coffee'):market('Coffee',return_role)}
    capital=800.
    tt=st=0
    tp=sp=0.
    rows=[]
    for index in range(legs):
        a,b,name=('Bridgetown','Saint-Pierre','Sugar') if index%2==0 else ('Saint-Pierre','Bridgetown','Coffee')
        row=best_trip(name,a,b,markets[a,name],markets[b,name],capital,tier=tt,sailing=st)
        assert row
        source,dest=markets[a,name],markets[b,name]
        purchase_stock=source['stock']
        source['stock']-=row['quantity']
        # Advance all markets through the purchase action and voyage before sale.
        for m in markets.values():
            m['stock']=recover(m['stock'],m['target'],(row['hours']-1)/24,m['tau'])
        proceeds=quote(GOODS[name]['price'],dest['role'],dest['stock'],dest['target'],row['quantity'],'sell',tt)
        row['net']=round(row['net']+proceeds-row['sell'],2)
        row['sell']=proceeds
        eligible_margin=learning_margin(GOODS[name]['price'],source['role'],purchase_stock,source['target'],dest['role'],dest['stock'],dest['target'],row['quantity'],tt,tt)
        dest['stock']+=row['quantity']
        for m in markets.values():
            m['stock']=recover(m['stock'],m['target'],1/24,m['tau'])
        capital+=row['net']
        if dynamic_skills:
            tp+=eligible_margin/100
            sp+=(row['hours']-2)/24
            while tt<10 and tp>=10*2**tt:
                tp-=10*2**tt;tt+=1
            while st<10 and sp>=10*2**st:
                sp-=10*2**st;st+=1
        row.update(leg=index+1,treasury=round(capital,2),next_trade_tier=tt,next_sailing_tier=st)
        rows.append(row)
    return rows

def main():
    checks=check_invariants()
    scenarios=[]
    for capital in (800,3000):
        scenarios.append(best_trip('Sugar','Bridgetown','Saint-Pierre',market('Sugar','Export'),market('Sugar','Import'),capital))
        scenarios.append(best_trip('Coffee','Saint-Pierre','Bridgetown',market('Coffee','Export'),market('Coffee','Neutral'),capital))
        scenarios.append(best_trip('Coffee','Saint-Pierre','Bridgetown',market('Coffee','Export'),market('Coffee','Import'),capital))
    scenarios.append(best_trip('Sugar','Bridgetown','Saint-Pierre',market('Sugar','Export'),market('Sugar','Import'),3000,weather=1.25))
    scenarios.append(best_trip('Coffee','Saint-Pierre','Bridgetown',market('Coffee','Export'),market('Coffee','Import'),3000,weather=1.25))
    scenarios.append(best_trip('Sugar','Bridgetown','Saint-Pierre',market('Sugar','Export'),market('Sugar','Import'),800,contracts=True))
    scenarios.append(best_trip('Common Cloth','Willemstad','Bridgetown',market('Common Cloth','Export'),market('Common Cloth','Import'),3000))
    scenarios.append(best_trip('Coffee','Saint-Pierre','Willemstad',market('Coffee','Export'),market('Coffee','Import'),12000,ship='Fluyt'))
    luxury=[]
    for stock_scale in (.1,.02):
        for name in ('Sugar','Coffee','Jewelry'):
            r=best_trip(name,'Bridgetown','Saint-Pierre',market(name,'Export',stock_scale),market(name,'Import',stock_scale),30000)
            r['luxury_stock_scale']=stock_scale
            luxury.append(r)
    xp_stock=100
    one=quote(10,'Import',xp_stock,100,100,'sell')
    first=quote(10,'Import',xp_stock,100,50,'sell')
    last=quote(10,'Import',xp_stock+50,100,50,'sell')
    xp=dict(cost=1000,one_sale_receipt=one,split_sale_receipts=[first,last],naive_whole_points=max(0,one-1000)/100,naive_split_points=(max(0,first-500)+max(0,last-500))/100)
    assert xp['naive_split_points']>xp['naive_whole_points']
    # Per-unit attribution before cash-line rounding is independent of basket boundaries.
    unit_margin=[max(0,10*ROLE['Import']*integral(100+i,101+i,100)*(1-spread(0))-10) for i in range(100)]
    assert math.isclose(sum(unit_margin),sum(unit_margin[:50])+sum(unit_margin[50:]),abs_tol=1e-10)
    xp['unit_margin_points']=round(sum(unit_margin)/100,6)
    provision=[]
    for q in (1000,3500,100000):
        p=market('Provisions','Neutral');paid=quote(1,'Neutral',p['stock'],p['target'],q,'buy')
        provision.append(dict(quantity=q,total=paid,average=round(paid/q,5),stock_left=100000-q))
    data=dict(invariant_checks=checks+1,scenarios=scenarios,contract_only=contract_only(),contract_headwinds=contract_only(weather=1.25),round_trips_original=round_trips('Neutral'),round_trips_revised=round_trips('Import'),round_trips_revised_fixed_skills=round_trips('Import',False),luxury= luxury,xp_counterexample=xp,provisions=provision,notes=['Analytical model, not a browser playtest.','Route examples assume perfect market knowledge, intact ships, optimal crew, and no encounters.','Single-good cargo optimization; no claim of optimal multi-good baskets.','Finite stock examples do not assign a complete role/access matrix to all goods.'])
    print(json.dumps(data,indent=2))

if __name__=='__main__':
    main()

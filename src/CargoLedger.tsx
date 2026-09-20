import {ALL_GOODS,CATALOGUE} from './goods';
import {aboard,cargoCost} from './trade';
import type {Game} from './game';
export function CargoLedger({game:g}:{game:Game}){
 return <><h2>Purchase ledger</h2><p className="muted">Costs follow the oldest cargo first. Starting cargo and old cargo without purchase records have unknown cost. Pre-ledger purchases use their recorded price curve, so rounding may differ slightly.</p><div className="table-wrap"><table><thead><tr><th>Goods</th><th>Recorded quantity</th><th>Unknown quantity</th><th>Allocated purchase cost</th><th>Average recorded cost</th></tr></thead><tbody>{ALL_GOODS.filter(id=>aboard(g,id)>0).map(id=>{const cost=cargoCost(g,id);return <tr key={id}><th scope="row">{CATALOGUE[id].name}</th><td>{cost.known.toFixed(1)}</td><td>{cost.unknown.toFixed(1)}</td><td>{cost.known?cost.total.toFixed(2):'Unknown'}</td><td>{cost.average?.toFixed(2)??'Unknown'}</td></tr>;})}</tbody></table></div></>;
}

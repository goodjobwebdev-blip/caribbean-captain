# Port-to-port voyage accounts

The captain's financial history is now recorded in Journal → Finance. This is informational; it does not change prices, rewards, timing or rolls.

## Automatic account boundaries

Each departure opens one account for that origin and destination. The account records the sea leg and stays open for business at the destination, including sales, quest collection, repairs, meals and purchases. The next departure closes it and starts a new account. It never groups multiple sea legs into an expedition.

Transactions before the first recorded departure appear under Initial port business. A failed voyage retains its account and stops further play. No manual opening, closing or checkpoint is required to create financial records. Church remains the only recovery checkpoint location.

This grouping makes arrival business visible alongside the journey that preceded it. Purchases preparing for the next leg affect the current account's cash flow, while their cost remains in inventory until the cargo is sold, used or lost. Account labels and opening/current treasury make the boundary explicit.

## Cash flow and recognized costs

Every cash mutation is recorded: purchases, sales, crew wages, recruiting, lodging, permits, contact fees, quest payments, repairs, preparation fees, inspection fines, pirate payments, encounter proceeds and ship exchanges.

Cargo sale history preserves the original port, game time, market channel, quantity, exact silver total and available FIFO purchase cost. Multiple lines in the same basket share a deal number. Ledger pagination changes only the view; older records are retained.

The Finance view separates:

- **Cash flow:** all recorded silver received minus silver spent. It reconciles to the treasury change.
- **Realized cargo margin:** sale receipts minus recorded acquisition cost of sold quantities. Buying and holding inventory does not create a trading loss.
- **Cash operating expenses:** wages, repairs, recruitment, lodging, permits, introductions, inspection fines and pirate payments.
- **Consumed/lost inventory costs:** provisions eaten, fruit spoiled, materials supplied to repairs, and confiscated purchases, using available acquisition records.
- **Operating result:** cargo margin plus quest/encounter proceeds, minus operating cash expenses and consumed/lost inventory cost.

Food-preparation fees are capitalized into the prepared provisions' recorded cost; they are not charged again as an immediate operating expense. Ship purchases and sales are capital cash flow and do not enter operating profit. The system does not calculate ship depreciation or automatically write off the ship's value on defeat. Financial records are an operating account, not a complete net-worth statement.

Unknown initial or legacy acquisition costs are displayed as unknown. When needed costs are missing, the complete margin/result is marked unknown rather than treating goods as free. Cash flow remains exact. Recorded purchase costs from before the purchase-ledger release may use their stored unrounded price curve, as already described in the supply ledger.

## Departure financial estimate

Voyage review adds a read-only forecast with normal winds, headwinds, and headwinds plus one day of delay. It shows:

- Duration, wages, food use and remaining food.
- Expected fruit loss and remaining whole trade quantities.
- Treasury on arrival before port business.
- Hypothetical sale proceeds at remembered legal-market prices and stock limits.
- Accepted contract payments available after successful delivery.
- Estimated result after known cargo costs, voyage meals and spoilage.

The forecast consumes food and ages fruit in a cloned state only. It uses remembered destination price curves and trading terms; it never reads live remote stock, events or current remote prices. Missing quotes produce an explicitly incomplete subtotal. Unknown cost or insufficient food prevents a complete result estimate.

Provisions are reserved for crew use, not projected for sale. Fractional leftover cargo remains inventory. The estimate excludes arrival trading/delivery hours, future repairs, inspections, encounter losses and unexpected market changes. Contract payments require actual delivery. It is not a guaranteed offer or an automatic trading action.

## Save migration and tests

Financial recording begins at the current treasury and game hour when the feature is first used. Older transactions are not reconstructed from the narrative log. An ongoing legacy voyage creates a clearly marked partial account from the time recording begins. All ledger entries, deal numbers and account boundaries are stored in profiles and church checkpoints. Restoring a checkpoint restores financial history along with the captain's other state.

Tests reconcile all recorded cash with treasury movement across services, trade, ship exchanges, encounters and failed voyages. They also cover account closure, destination payments, unchanged closed accounts, unknown costs, preparation cost treatment, spoilage, confiscation, invalid actions, legacy voyages, checkpoint restoration and remote-price isolation. The engine playtest includes a six-tier ship comparison with ledger reconciliation, alongside the repeated-route scenarios.

Interactive desktop/mobile browser verification remains unavailable in this environment. Component rendering and production builds are checked. Merchant procurement contracts remain a proposed subsequent feature; this release does not introduce them.

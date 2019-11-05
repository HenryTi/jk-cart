import * as React from 'react';
import { tv, View } from 'tonva';
import { CProduct } from './CProduct';
import { observer } from 'mobx-react';
import { observable } from 'mobx';

export class VProductDelivery extends View<CProduct> {

    @observable private inventoryAllocation: any[];
    @observable private futureDeliveryTimeDescription: string;

    render(param: any): JSX.Element {
        let { obj: packObj, id: packId } = param;
        let { owner: productId } = packObj;
        let { controller } = this;
        let { currentSalesRegion } = controller.cApp;
        return <this.content packId={packId} productId={productId} currentSalesRegion={currentSalesRegion} />;
    }

    private initInventoryAllocation = async (productId: number, packId: number, salesRegionId: number) => {
        if (this.inventoryAllocation === undefined)
            this.inventoryAllocation = await this.controller.getInventoryAllocation(productId, packId, salesRegionId);
    }

    private initFutureDeliveryTimeDescription = async (productId: number, salesRegionId: number) => {
        if (this.futureDeliveryTimeDescription === undefined)
            this.futureDeliveryTimeDescription = await this.controller.getFutureDeliveryTimeDescription(productId, salesRegionId);
    }

    private content = observer((param: any): any => {

        let deliveryTimeUI;
        let { packId, productId, currentSalesRegion } = param;
        if (productId) {
            this.initInventoryAllocation(productId, packId, currentSalesRegion);
            this.initFutureDeliveryTimeDescription(productId, currentSalesRegion);
        }
        if (this.inventoryAllocation === undefined || this.futureDeliveryTimeDescription === undefined)
            return null;
        if (this.inventoryAllocation && this.inventoryAllocation.length > 0) {
            deliveryTimeUI = this.inventoryAllocation.map((v, index) => {
                let { warehouse, quantity, deliveryTimeDescription } = v;
                if (quantity > 0) {
                    return <div key={index} className="text-success">
                        {tv(warehouse, (values: any) => <span className="small">{values.name}</span>)}: {(quantity > 10 ? '>10' : quantity)}
                        {deliveryTimeDescription}
                    </div>
                } else {
                    return undefined;
                }
            });
        } else {
            deliveryTimeUI = <div>{this.futureDeliveryTimeDescription && '期货: ' + this.futureDeliveryTimeDescription}</div>;
        }
        return deliveryTimeUI;
    })
}
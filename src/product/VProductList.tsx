import * as React from 'react';
import { VPage, Page, Scroller } from 'tonva';
import { CProduct, renderProduct } from './CProduct';
import { List } from 'tonva';
import { observer } from 'mobx-react';

export class VProductList extends VPage<CProduct> {

    private searchKey: string;
    async open(key: string) {
        this.searchKey = key;
        this.openPage(this.page);
    }

    private onProductClick = async (product: any) => {
        this.controller.showProductDetail(product.id);
    }

    private onScrollBottom = async (scroller: Scroller) => {
        scroller.scrollToBottom();
        await this.controller.pageProducts.more();
    }

    private page = observer(() => {

        let { pageProducts, cApp } = this.controller;
        let { cHome, cCart } = cApp;
        let header = cHome.renderSearchHeader();
        let cart = cCart.renderCartLabel();
        let none = <div className="my-3 mx-2 text-warning">抱歉，未找到相关产品，请重新搜索！</div>
        return <Page header={header} right={cart} onScrollBottom={this.onScrollBottom}>
            <div className="bg-white p-2 mb-1">搜索条件: <strong>{this.searchKey}</strong></div>
            <List before={''} none={none} items={pageProducts} item={{ render: renderProduct, onClick: this.onProductClick }} />
        </Page>
    });
}
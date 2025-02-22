//import { observable } from 'mobx';
import _ from 'lodash';
import { CUqBase } from '../CBase';
import { VRootCategory } from './VRootCategory';
import { VCategory } from './VCategory';
import './cat.css';

export class CProductCategory extends CUqBase {
    rootCategories: any[] = [];
    //@observable categories2: any[] = [];

    async internalStart(param: any) {
        this.uqs.product.ProductCategory.stopCache();

        let { currentSalesRegion, currentLanguage } = this.cApp;
        let results = await this.uqs.product.GetRootCategory.query({
            salesRegion: currentSalesRegion.id, 
            language: currentLanguage.id 
        });
        let {first, secend, third} = results;
        /*
        (first as any[]).forEach(element => {
            this.buildCategories(element, secend, third);
        });
        */
        this.rootCategories = (first as any[]).map(v => {
            return this.buildCategories(v, secend, third);
        });
        /*
        let result2 = await this.getRootCategoriesQuery.query({ salesRegion: currentSalesRegion.id, language: currentLanguage.id });
        if (result2)
            this.categories2 = result2.ret;
        */
    }

    renderRootList = () => {
        return this.renderView(VRootCategory);
    };

    private async getCategoryChildren(parentCategoryId: number) {
        let { currentSalesRegion, currentLanguage } = this.cApp;
        return await this.uqs.product.GetChildrenCategory.query({ 
            parent: parentCategoryId,
            salesRegion: currentSalesRegion.id, 
            language: currentLanguage.id 
        });
    }

    private buildCategories(categoryWapper: any, firstCategory: any[], secendCategory: any[]):any {
        let {productCategory} = categoryWapper;
        let catId:number = productCategory.id, children:any[] = [];
        for (let f of firstCategory) {
            if (f.parent !== catId) continue;
            let pcid = f.productCategory.id;
            let len = secendCategory.length;
            let subsub = '';
            for (let j=0; j<len; j++) {
                //element.children = secendCategory.filter((v: any) => v.parent === pcid);
                let {name, parent} = secendCategory[j];
                if (parent !== pcid) continue;
                if (subsub.length > 0) subsub += ' / ';
                subsub += name;
                let sLen = subsub.length;
                if (sLen > 40) break;
            }
            if (subsub.length > 0) f.subsub = subsub;
            children.push(f);
        }
        //categoryWapper.children = firstCategory.filter((v: any) => v.parent === pcid);
        let ret = _.clone(categoryWapper);
        ret.children = children; // firstCategory.filter((v: any) => v.parent === pcid);
        return ret;
    }

    async openMainPage(categoryWaper: any, parent: any, labelColor: string) {

        let { productCategory, name } = categoryWaper;
        let { id: productCategoryId } = productCategory;
        let results = await this.getCategoryChildren(productCategoryId);
        if (results.first.length !== 0) {
            let rootCategory = this.buildCategories(categoryWaper, results.first, results.secend);
            this.openVPage(VCategory, { categoryWaper: rootCategory, parent, labelColor });
        } else {
            let { cProduct } = this.cApp;
            await cProduct.searchByCategory({ productCategoryId, name });
        }
    }
}

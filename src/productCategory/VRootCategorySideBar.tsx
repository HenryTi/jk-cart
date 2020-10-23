import * as React from 'react';
import { View } from 'tonva';
import { CProductCategory } from './CProductCategory';

export class VRootCategorySideBar extends View<CProductCategory>{

    private categoryClick = async (categoryWapper: any, parent: any, labelColor: string) => {
        await this.controller.openMainPage(categoryWapper, parent, labelColor);
    }

    render(rootCategories: any) {

        return <>
            <h2>产品分类</h2>
            <nav id="sidebar">
                <ul className="list-unstyled components">
                    {rootCategories.map((v: any) => {
                        return <li className="active" key={v.name}>
                            <a href={"#Submenu" + v.name} data-toggle="collapse" aria-expanded="false">{v.name}</a>
                            <ul className="collapse list-unstyled" id={"Submenu" + v.name}>
                                {v.children.map((e: any) => <li onClick={() => this.categoryClick(e, undefined, '')} key={e.name}>{e.name}</li>)}
                            </ul>
                        </li>
                    })}
                </ul>
            </nav>
        </>
    }
}
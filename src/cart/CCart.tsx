import { RowContext, BoxId } from 'tonva';
import { CUqBase } from '../tapp/CBase';
import { VCartLabel } from './VCartLabel';
import { VCartLabelWeb } from './VCartLabelWeb';
import { VCart } from './VCart';
import { CartPackRow, CartItem, Cart } from './Cart';
import { Product } from 'model';

export class CCart extends CUqBase {
	cart: Cart;

    private selectedCartItems: CartItem[];

    protected async internalStart(param: any) {
        this.openVPage(VCart);
    }


	get count(): number {return this.cart?.count.get();}

	async buildItems(): Promise<void> {
		await this.cart?.buildItems();
	}

	async buildData() {
		this.cart = new Cart(this.cApp);
		await this.cart.init();
		await this.cart.buildItems();
	}

    disposeCart() {
		this.cart.dispose();
	}

	getQuantity(productId: number, packId: number): number {
		return this.cart.getQuantity(productId, packId);
	}

	async add(product: Product, pack: BoxId, quantity: number, price: number, retail: number, currency: any) {
		await this.cart.add(product, pack, quantity, price, retail, currency);
	}

	async removeItem(rows: [{ productId: number, packId: number }]) {
		await this.cart.removeItem(rows);
	}

	async againOrderCart(data: CartItem[]) {
		await this.cart.againOrderCart(data);
	}

    /**
     *
     * 显示购物车图标
     */
    renderCartLabel() {
        return this.renderView(VCartLabel);
    }

    renderCartLabel_web() {
        return this.renderView(VCartLabelWeb);
    }

    /**
     * 修改购物车中产品数量 
     * @param context 
     * @param value 
     * @param prev 
     */
    onQuantityChanged = async (context: RowContext, value: any, prev: any) => {
        let { data, parentData } = context;
        let { product } = parentData;
        let { pack, price, retail, currency } = data as CartPackRow;
        //let { cart } = this.cApp;
        if (value > 0)
            await this.cart.add(product, pack, value, price, retail, currency);
        else
            await this.cart.removeItem([{ productId: product.id, packId: pack.id }]);
    }

    /**
     * 
     * @param row 
     */
    onRemoveCartItem = (row: any) => {
        let { product, packs } = row;
        //let { cart } = this.cApp;
        let packsToDeleted: any = [];
        packs.forEach((each: any) => {
            packsToDeleted.push({ productId: product.id, packId: each.pack.id });
        });
        this.cart.removeItem(packsToDeleted);
    }

    onRowStateChanged = async (context: RowContext, selected: boolean, deleted: boolean) => {
        alert('onRowStateChanged')
    }

    /*
    private loginCallback = async (user: User): Promise<void> => {
        let { cApp } = this;
        await cApp.currentUser.setUser(user);
        await cApp.loginCallBack(user);
        this.closePage(1);
        await this.doFirstOrderChecking();
    };
    */

    onItemClick = (cartItem: CartItem) => {
        let { cProduct } = this.cApp;
        let { product } = cartItem;
        if (!this.cart.isDeleted(product.id)) {
            cProduct.showProductDetail(product.id);
        }
    }
    /**
     * 商品从购物车永久性删除
     */
    strikeOut = async () => {
        //let { cart } = this.cApp;
        this.selectedCartItems = this.cart.getSelectedItems();
        await this.cart.removeStrike(this.selectedCartItems)


        // let combinedData = this.selectedCartItems.map((el: CartItem2) => {
        //     return el.packs.map((v: any) => {
        //         return {
        //             productId: el.product, packId: v.pack
        //         }
        //     })
        // }).flat();
        // combinedData.forEach(async (el: any) => {
        //     await cart.removeFromCart(el);
        // })
    }

    checkOut = async () => {
        //let { cart } = this.cApp;
        this.selectedCartItems = this.cart.getSelectedItems();
        if (this.selectedCartItems === undefined) return;
        /*
        if (!this.isLogined) {
            nav.showLogin(this.loginCallback, true);
        } else {
            await this.doFirstOrderChecking();
        }
        */
        await this.cApp.assureLogin();
        await this.doFirstOrderChecking();
    }

    private doFirstOrderChecking = async () => {
        let { cMe, currentUser } = this.cApp;
        if (!currentUser || !currentUser.allowOrdering) {
            cMe.toPersonalAccountInfo(this.doCheckOut);
            // cMe.openMeInfoFirstOrder({
            //     onlyRequired: false,
            //     caption: "请补充账户信息",
            //     note: <>
            //         化学品是受国家安全法规限制的特殊商品，百灵威提供技术咨询、资料以及化学产品的对象必须是具有化学管理和应用能力的专业单位（非个人）。
            //     为此，需要您重新提供非虚拟的、可核查的信息。这些信息包括下面所有带有 <span className="text-danger">*</span> 的信息。
            //     </>,
            //     actionButton: {
            //         value: "下一步",
            //         action: this.doCheckOut
            //     }
            // });
        } else {
            await this.doCheckOut();
        }
    }

    /**
     * 导航到CheckOut界面
     */
    doCheckOut = async () => {

        let { cOrder } = this.cApp;
        let { selectedCartItems } = this;
        if (selectedCartItems === undefined) return;
        await cOrder.createOrderFromCart(selectedCartItems);
        // await cOrder.start(this.selectedCartItems);
    }

    //tab = () => this.renderView(VCart);

    renderDeliveryTime = (pack: BoxId) => {
        let { cProduct } = this.cApp;
        return cProduct.renderDeliveryTime(pack);
    }

    renderCartProduct = (product: Product) => {
        let { cProduct } = this.cApp;
        return cProduct.renderCartProduct(product);
    }

    tabPage: VCart = new VCart(this);
}

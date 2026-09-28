import "./ProductsPage.css";
import noproduct from "../assets/guest/noproduct.png"
import useDocumentTitle from "../hooks/useDocumentTitle";
const ProductsPage = () => {
    useDocumentTitle("Products");
    return (
        <main className="product-page page-footer-space">
            <div className="product-coming-soon">
                <div className="product-image-placeholder">
                    <img src={noproduct} />
                </div>
                <h1>
                    Our engineers are working hard to ship products. <br></br>
                    Please come back later!
                </h1>
            </div>
        </main>
    );
}

export default ProductsPage;
const BASE_URL = "http://localhost:8080/api/products";

//Get
export async function getProducts(){
    const res = await fetch(BASE_URL);
    if(!res.ok) throw new Error("Failed to fetch products");
    return res.json();
}

//Post
export async function createProduct(productData){
    const res = await fetch(BASE_URL, {
        method: 'POST',
        headers: {"Content-Type" : "application/json"},
        body: JSON.stringify(productData),
    });
    if(!res.ok) throw new Error("Failed to create product");
    return res.json();
}
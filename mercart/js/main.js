const AH = "https://wax.api.atomicassets.io/atomicassets/v1/";
const IPFS = "https://cloudflare-ipfs.com/ipfs/";
const mercart_cols = ["littlemonst1", "dustandblood", "fantasyartio"];

const load = async() => {
    var address = $("#address").val();
    console.log(address);
    var results = [];
    for (let i = 0; i < mercart_cols.length; i++) {
        await fetch_assets(address, mercart_cols[i]);
    }
}

const fetch_assets = async(address, collection) => {
    var page = 1;
    var url = new URL("assets", AH);
    var params = new URLSearchParams({
            owner: address,
            collection_name: collection,
            page: page
        });
    url.search = params;

    page++;
    params.set("page", page);
    console.log(url.toString());
}
const AH = "https://wax.api.atomicassets.io/atomicassets/v1/";
const AH_LINK = "https://wax.atomichub.io/explorer/asset/";
const IPFS = "https://cloudflare-ipfs.com/ipfs/";
const COLLECTION = "mnsterstrike";

var address = "";

// WaxJS
const wax = new waxjs.WaxJS({rpcEndpoint: 'https://chain.wax.io', tryAutoLogin: true});

const check_login = async() => {
    startLoginView();
    var isAutoLoginAvailable = await wax.isAutoLoginAvailable();
    if (isAutoLoginAvailable) {
        address = wax.userAccount;
        endLoginView();
        load();
    } else {
        endLoginView();
    }
}

// Normal login. Triggers a popup for non-whitelisted dapps
const login = async() => {
    startLoginView();
    if (address == "") {
        try {
            await wax.login();
            address = wax.userAccount;
            load();
        } catch(e) {
            alert(e.message);
        }
    } else {
        var logout = confirm("Logout?");
        if (logout) {
            address = "";
            clearView("#results");
        }
    }
    endLoginView();
}

// Controller
const load = async() => {
    startLoadView();
    var assets = await fetchAssets(address);

    for (const i of assets) {
        populateView("#results", "#tmplt_result_item", i);
    }
    completeLoadView(assets);
}

// Models
const fetchAssets = async(address) => {
    var url = new URL("assets", AH);
    var params = new URLSearchParams({
            collection_name: COLLECTION,
            owner: address,
            page: 1,
            limit: 500
        });
    url.search = params;
    var r = await fetch(url.toString());

    var assets = [];
    if (r.ok) {
        var response = await r.json();
        for (const i of response.data) {
            assets.push({
                name: i.name,
                mint: i.template_mint,
                ah: AH_LINK + i.asset_id,
                img: IPFS + i.template.immutable_data.img
            });
        }
    }
    return assets;
}

// Views
const populateView = (view, tmplt, data) => {
    var template = $(tmplt).html();
    var rendered = $(Mustache.render(template, data));
    rendered.appendTo(view);
    return rendered;
}

const clearView = (view) => {
    $(view).empty();
    $("#outcome").html("Total of 0 assets");
}

const startLoginView = () => {
    $("#addy").removeClass("disabled");
}

const endLoginView = () => {
    $("#addy").addClass("disabled");
    if (address == "") {
        $("#addy a").html("Login");
    } else {
        $("#addy a").html(address);
    }
}

const startLoadView = () => {
    $("#loading").removeClass("visually-hidden");
}

const completeLoadView = (assets) => {
    $("#loading").addClass("visually-hidden");
    if (assets.length > 0) {
        $("#outcome").html("Total of "+ assets.length + " assets");
    } else {
        $("#outcome").html("No assets found!");
    }
}

check_login();
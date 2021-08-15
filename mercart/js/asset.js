const AH = "https://wax.api.atomicassets.io/atomicassets/v1/";
const IPFS = "https://cloudflare-ipfs.com/ipfs/";
const mercartCols = ["littlemonst1", "dustandblood", "fantasyartio"];
const dictionary = {};

// Controller
const load = async() => {
    updateLoadView();

    var assetid = $("#assetid").val();
    if (isNaN(assetid)) {
        var result = {status: "Invalid asset ID"};
    } else {
        var result = await fetchAsset(assetid);
        if (result.status == "ok") {
            await calculateScore(result);
        }
    }

    console.log(result);
    updateResultView(result);
}


// Models
const _fetchAsset = async(assetid) => {
    var url = new URL("assets", AH);
    var params = new URLSearchParams({
            asset_id: assetid
        });
    url.search = params;

    var response = await fetch(url.toString());

    return response;
}

const fetchAsset = async(assetid) => {
    var response = await _fetchAsset(assetid);
    var result = {};

    if (!response.ok) {
        result.status = "Something went wrong, please try again later.";
        return result;
    }

    var r = await response.json();
    var data = r.data;
    if (data.length < 1) {
        result.status = "Asset not found!";
        return result;
    }

    result.collection = data[0]["collection"]["collection_name"];
    if (mercartCols.indexOf(result.collection) == -1) {
        result.status = result.collection + " collection is not supported!";
        return result;
    }

    result.asset_id = assetid;
    result.schema = data[0]["schema"]["schema_name"];
    result.template_id = data[0]["template"]["template_id"];
    result.img = data[0]["data"]["img"];
    result.name = data[0]["data"]["name"];
    if (data[0]["data"]["Edition"] === undefined) {
        result.edition = data[0]["data"]["Series"];
    } else {
        result.edition = data[0]["data"]["Edition"];
    }
    if (data[0]["data"]["Artist"] !== undefined) {
        result.artist = data[0]["data"]["Artist"];
    } else if (data[0]["data"]["Art By"] !== undefined) {
        result.artist = data[0]["data"]["Art By"];
    } else {
        result.artist = data[0]["data"]["Created By"];
    }
    result.rarity = data[0]["data"]["Rarity"];
    result.owner = data[0]["owner"];
    result.status = "ok";

    return result;
}

const populateDictionary = async(collection) => {
    var url = "./res/" + collection + ".json";
    var r = await fetch(url);
    var response = await r.json();
    dictionary[collection] = response;
}

const calculateScore = async(result) => {
    if (dictionary[result.collection] === undefined) {
        await populateDictionary(result.collection);
    }

    var ref = dictionary[result.collection].find(function(post, index) {
        if (post.template == parseInt(result.template_id)) {
            return true;
        }
    });

    if (ref === undefined) {
        result.score = 0;
    } else if (ref.method == "fixed") {
        result.score = ref.value;
    } else {
        var url = new URL("templates/" + result.collection + "/" + result.template_id + "/stats", AH);
        var r = await fetch(url.toString());
        if (!r.ok) {
            result.status = "Something went wrong, please try again later.";
            return;
        }

        var response = await r.json();
        var data = response.data;
        if (data.length < 1) {
            result.status = "Asset stats not found!";
            return;
        }

        var circulating = parseInt(data["assets"]) - parseInt(data["burned"]);
        result.score = 700 / circulating / 3 * ref.value;
    }
}

// Views
const updateLoadView = () => {
    $("#loading").removeClass("visually-hidden");
    $("#failed").addClass("visually-hidden");
    $("#results").addClass("visually-hidden");
}

const updateResultView = (result) => {
    if (result.status == "ok") {
        for (key in result) {
            if (key != "img" && key != "status") {
                $("#" + key).html(result[key]);
            }
        }
        $("#result_img").removeAttr("src").attr("src", IPFS + result.img);
    } else {
        $("#failed").html(result.status);
    }

    $("#loading").addClass("visually-hidden");
    if (result.status == "ok") {
        $("#results").removeClass("visually-hidden");
    } else {
        $("#failed").removeClass("visually-hidden");
    }
}
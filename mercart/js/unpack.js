const EXPLORER = "https://wax.eosx.io/tx/";
const COLLECTIONS = [
    {"collection": "dustandblood"},
    {"collection": "littlemonst1"},
    {"collection": "fantasyartio"}
];
const PACKS = [
    {"collection_name": "dustandblood", "template_id": "366400", "template_name": "Original Art Chase Drop 2"},
    {"collection_name": "dustandblood", "template_id": "349044", "template_name": "Original Art Chase Drop 1"},
    {"collection_name": "littlemonst1", "template_id": "340235", "template_name": "Halloween Special Blend Pack"},
    {"collection_name": "fantasyartio", "template_id": "410249", "template_name": "Fantasy io Original Art Chase Drop 3"},
    {"collection_name": "fantasyartio", "template_id": "377671", "template_name": "Fantasy io Original Art Chase Drop 2"},
    {"collection_name": "fantasyartio", "template_id": "359211", "template_name": "Fantasy io Original Art Chase Drop 1"},
    {"collection_name": "fantasyartio", "template_id": "294536", "template_name": "Small Pack"},
    {"collection_name": "fantasyartio", "template_id": "294537", "template_name": "Standard Pack"},
    {"collection_name": "fantasyartio", "template_id": "294540", "template_name": "Large Pack"},
    {"collection_name": "fantasyartio", "template_id": "294563", "template_name": "Large Pack Bonus Bundle"}
];
var data;
var transformed_data = [];

// Controller
const load = async() => {
    populateResultItemView("#collection", "#tmplt_filter", COLLECTIONS, null);

    var url = new URL(window.location.href);
    var collection = url.searchParams.get("c");
    found = false;
    for (let i = 0; i < COLLECTIONS.length; i++) {
        if (COLLECTIONS[i].collection == collection) {
            found = true;
            break;
        }
    }
    if (!found) {
        return;
    } else {
        updateFilterView(collection);
        toggleLoadView();
    }

    data = await populateVar(collection);
    updateTimestampView();

    for (let i = 0; i < PACKS.length; i++) {
        if (PACKS[i].collection_name != collection) {
            continue;
        }
        var col_info = {"collection": PACKS[i].collection_name,
                        "template": PACKS[i].template_id,
                        "name": PACKS[i].template_name};
        populateContainer("#navigation", "#tmplt_nav", col_info);
    }

    for (let i = 0; i < PACKS.length; i++) {
        if (PACKS[i].collection_name != collection) {
            continue;
        }
        prepareData(PACKS[i], transformed_data);
        var col_info = {"collection": PACKS[i].collection_name,
                        "template": PACKS[i].template_id,
                        "name": PACKS[i].template_name};
        var tbl = populateContainer("#results", "#tmplt_result_tbl", col_info);
        var found = transformed_data.find(e => e.key == PACKS[i].collection_name + PACKS[i].template_id);
        populateResultItemView(tbl.find("tbody"), "#tmplt_result_item", found.data, found.key);
    }
    toggleLoadView();
}

// Models
const populateVar = async(collection) => {
    var url = "./res/unpack_" + collection + ".json";
    var r = await fetch(url);
    var response = await r.json();
    return response;
}

const prepareData = async(pack, out) => {
    var output = [];
    var key = pack.collection_name + pack.template_id;
    for (let i = 0; i < data.data.length; i++) {
        if (pack.template_id == data.data[i].template_id) {
            var found = output.find(e => e.address == data.data[i].sender_name);
            if (found == undefined) {
                var item = {"address": data.data[i].sender_name};
                item.count = 1;
                item.txns = [{"time": new Date(parseInt(data.data[i].time)), "txn": EXPLORER + data.data[i].txn}];
                output.push(item);
            } else {
                found.count++;
                found.txns.push({"time": new Date(parseInt(data.data[i].time)), "txn": EXPLORER + data.data[i].txn});
            }
        }
    }
    function compare(a, b) {
        if (a.count < b.count) {
            return 1;
        }
        if (a.count > b.count) {
            return -1;
        }
        return 0;
    }
    output.sort(compare);
    out.push({"key": key, "data": output});
}

const summary = async(address, key) => {
    var found = transformed_data.find(e => e.key == key);
    var result = found.data.find(e => e.address == address);
    updateAddressView(address);
    var tbl = $("#txns").find("tbody");
    tbl.empty();
    populateResultItemView(tbl, "#tmplt_txn_item", result.txns);
}

// Views
const updateTimestampView = () => {
    $("#last_update").html(new Date(data.timestamp));
}

const updateAddressView = (address) => {
    $("#address").html(address);
}

const updateFilterView = (collection) => {
    $("#collection_lbl").html(collection);
    $("#collection li").each(function () {
        if ($(this).children().html() == collection) {
            $(this).children().addClass("active");
        }
    });
}

const populateContainer = (view, tmplt, data) => {
    var template = $(tmplt).html();
    var rendered = $(Mustache.render(template, data));
    rendered.appendTo(view);
    return rendered;
}

const populateResultItemView = (view, tmplt, data, key) => {
    var template = $(tmplt).html();
    count = 1;
    for (const i of data) {
        var input = Object.assign({}, i);
        input.key = key;
        input.item_count = count;
        var rendered = $(Mustache.render(template, input));
        rendered.appendTo(view);
        count++;
    }
}

const toggleLoadView = () => {
    $("#loading").toggleClass("visually-hidden");
}

load();

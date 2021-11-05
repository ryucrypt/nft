const PACKS = [
    {"collection_name": "littlemonst1", "template_id": "340235", "template_name": "Halloween Special Blend Pack"},
    {"collection_name": "fantasyartio", "template_id": "294536", "template_name": "Small Pack"},
    {"collection_name": "fantasyartio", "template_id": "294537", "template_name": "Standard Pack"},
    {"collection_name": "fantasyartio", "template_id": "294540", "template_name": "Large Pack"},
    {"collection_name": "fantasyartio", "template_id": "294563", "template_name": "Large Pack Bonus Bundle"}
];
var data;
var transformed_data = [];

// Controller
const load = async() => {
    data = await populateVar();
    updateTimestampView();
    for (let i = 0; i < PACKS.length; i++) {
         var col_info = {"collection": PACKS[i].collection_name,
                        "template": PACKS[i].template_id,
                        "name": PACKS[i].template_name};
        populateContainer("#navigation", "#tmplt_nav", col_info);
    }
    for (let i = 0; i < PACKS.length; i++) {
        prepareData(PACKS[i], transformed_data);
        var col_info = {"collection": PACKS[i].collection_name,
                        "template": PACKS[i].template_id,
                        "name": PACKS[i].template_name};
        var tbl = populateContainer("#results", "#tmplt_result_tbl", col_info);
        var found = transformed_data.find(e => e.key == PACKS[i].collection_name + PACKS[i].template_id);
        populateResultItemView(tbl.find("tbody"), "#tmplt_result_item", found.data, found.key);
    }
    completeLoadView();
}

// Models
const populateVar = async() => {
    var url = "./res/unpack.json";
    var r = await fetch(url);
    var response = await r.json();
    return response;
}

const prepareData = async(pack, out) => {
    var output = [];
    var key = pack.collection_name + pack.template_id;
    for (let i = 0; i < data.data.length; i++) {
        if (pack.collection_name == data.data[i].collection_name && pack.template_id == data.data[i].template_id) {
            var found = output.find(e => e.address == data.data[i].sender_name);
            if (found == undefined) {
                var item = {"address": data.data[i].sender_name};
                item.count = 1;
                item.txns = [{"time": new Date(parseInt(data.data[i].time)), "txn": data.data[i].txn}];
                output.push(item);
            } else {
                found.count++;
                found.txns.push({"time": new Date(parseInt(data.data[i].time)), "txn": data.data[i].txn});
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
    console.log(result.txns);
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

const completeLoadView = () => {
    $("#loading").addClass("visually-hidden");
}

load();
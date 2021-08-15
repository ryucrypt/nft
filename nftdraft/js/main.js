const AH = "https://wax.api.atomicassets.io/atomicassets/v1/";
const AH_LINK = "https://wax.atomichub.io/explorer/asset/";
const COLLECTION = "nftdraft2121";
const SCHEMA = "playercard21";
const PREMINT = "nftdraftbotx";

var pos = [];
var teams = [];
var dictionary = {};
var remainder = [];
var claimed = 0;
var remaining = 0;

var filterClaimed = [];
var filterPos = {};
var filterTeam = {};
var curFilterTeam = "All Teams";
var curFilterPos = "All Positions";
var curFilterClaimed = "All";

// Controller
const load = async() => {
    if (!await fetchRemainder()) {
        return;
    }
    dictionary = await populateVar(COLLECTION, dictionary);

    pos = await populateVar("pos", pos);
    populateView("#pos", "#tmplt_filter", {items: pos});
    teams = await populateVar("teams", teams);
    populateView("#teams", "#tmplt_filter", {items: teams});

    var count = 0;
    var container = populateContainer("#results", "#tmplt_container", null);
    for (const i of teams) {
        var output = await prepareData(i.name);
        updateCountView();
        var tbl = populateContainer(container, "#tmplt_result_tbl", output.team);
        filterTeam[i.name] = tbl;
        populateResultItemView(tbl.find("tbody"), "#tmplt_result_item", output.pos, i.name);

        if (count < 3) {
            count++;
        } else {
            container = populateContainer("#results", "#tmplt_container", null);
            count = 0;
        }
    }
    completeLoadView();
}

// Utils
const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Models
const populateVar = async(target) => {
    var url = "./res/" + target + ".json";
    var r = await fetch(url);
    var response = await r.json();
    return response;
}

const fetchRemainder = async() => {
    var url = new URL("accounts/" + PREMINT + "/" + COLLECTION, AH);
    var r = await fetch(url.toString());
    
    if (!r.ok) {
        return false;
    }

    var response = await r.json();
    remainder = response.data.templates;
    return true;
}

const fetchOwner = async(template_id) => {
    var url = new URL("assets", AH);
    var params = new URLSearchParams({
            collection_name: COLLECTION,
            schema_name: SCHEMA,
            template_id: template_id
        });
    url.search = params;
    await sleep(Math.floor(Math.random() * (50 - 200 + 1)) + 50);
    var r = await fetch(url.toString());

    if (!r.ok) {
        return {owner: "error", asset_id: "error"};
    }

    var response = await r.json()
    var data = response.data;
    if (data.length < 1) {
        return {owner: "error", asset_id: "error"};
    }

    return {owner: data[0].owner, asset_id: data[0].asset_id};
}

const prepareData = async(name, id) => {
    items = dictionary[name];
    output = {
        team: {name: name, remaining: 0},
        pos: []
    };
    for (const i of items) {
        var ref = remainder.find(function(post, index) {
            if (post.template_id == i.template_id) {
                return true;
            }
        });
        if (ref) {
            i.owner = PREMINT;
            remaining++;
            output.team.remaining++;
        } else {
            var result = await fetchOwner(i.template_id);
            i.owner = result.owner;
            i.asset_id = result.asset_id;
            if (result.owner == "error") {
                remaining++;
                output.team.remaining++;
            } else {
                claimed++;
            }
        }
        output.pos.push({
            position: i.position,
            owner: i.owner,
            asset_id: i.asset_id,
            url: function() {
                return function(text, render) {
                    if (this.owner == PREMINT) {
                        return render(text);
                    } else {
                        return "<a href=\"" + AH_LINK + this.asset_id + "\" target=\"_blank\">" + render(text) + "</a>";
                    }
                }
            }
        });
    }

    return output;
}

// Views
const populateView = (view, tmplt, data) => {
    var template = $(tmplt).html();
    var rendered = Mustache.render(template, data);
    $(view).append(rendered);
}

const populateContainer = (view, tmplt, data) => {
    var template = $(tmplt).html();
    var rendered = $(Mustache.render(template, data));
    rendered.appendTo(view);
    return rendered;
}

const populateResultItemView = (view, tmplt, data, team) => {
    var template = $(tmplt).html();
    for (const i of data) {
        var rendered = $(Mustache.render(template, i));
        rendered.appendTo(view);
        if (i.owner != PREMINT) {
            filterClaimed.push(rendered);
        }
        if (filterPos[i.position] === undefined) {
            filterPos[i.position] = [rendered];
        } else {
            filterPos[i.position].push(rendered);
        }
    }
}

const completeLoadView = () => {
    $("#status_lbl").removeAttr("disabled");
    $("#pos_lbl").removeAttr("disabled");
    $("#teams_lbl").removeAttr("disabled");
    $("#remainder").removeAttr("disabled");
    $("#loading").addClass("visually-hidden");
}

const updateCountView = () => {
    $("#claimed").html(claimed);
    $("#remaining").html(remaining);
}

$("#pos").on("click", "a", function(event) {
    var pos = $(this).text();

    if (curFilterPos == pos) {
        return
    }

    if (curFilterPos != "") {
        for (const i in filterPos) {
            if (i != curFilterPos) {
                for (const j of filterPos[i]) {
                    if (curFilterClaimed == "Remaining") {
                        if(filterClaimed.includes(j)) {
                            continue;
                        }
                    } else if (curFilterClaimed == "Claimed") {
                        if(!filterClaimed.includes(j)) {
                            continue;
                        }
                    }
                    j.removeClass("visually-hidden");
                }
            }
        }
        curFilterPos = ""
    }
    if (pos != "All Positions") {
        for (const i in filterPos) {
            if (i != pos) {
                for (const j of filterPos[i]) {
                    j.addClass("visually-hidden");
                }
            }
        }
    }
    curFilterPos = pos;

    $("#pos_lbl").html(pos);
    $("#pos li a").removeClass("active");
    $(this).addClass("active");
});

$("#teams").on("click", "a", function(event) {
    var team = $(this).text();

    if (curFilterTeam == team) {
        return
    }

    for (const i in filterTeam) {
        if (i != curFilterTeam) {
            filterTeam[i].removeClass("visually-hidden");
        }
    }
    if (team != "All Teams") {
        for (const i in filterTeam) {
            if (i != team) {
                filterTeam[i].addClass("visually-hidden");
            }
        }
    }
    curFilterTeam = team;

    $("#teams_lbl").html(team);
    $("#teams li a").removeClass("active");
    $(this).addClass("active");
});

$("#status").on("click", "a", function(event) {
    var status = $(this).text();

    if (curFilterClaimed == status) {
        return
    }

    for (const i in filterPos) {
        if (i == curFilterPos || curFilterPos == "All Positions") {
            for (const j of filterPos[i]) {
                j.removeClass("visually-hidden");
            }
        }
    }

    if (status == "Remaining") {
        for (const i of filterClaimed) {
            i.addClass("visually-hidden");
        }
    } else if (status == "Claimed") {
        for (const i in filterPos) {
            for (const j of filterPos[i]) {
                if (!filterClaimed.includes(j)) {
                    j.addClass("visually-hidden");
                }
            }
        }
    }
    curFilterClaimed = status;

    $("#status_lbl").html(status);
    $("#status li a").removeClass("active");
    $(this).addClass("active");
});

load();
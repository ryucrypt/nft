const chainId = "1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4";
const endpoint = "wax.greymass.com";
const dapp = "ryucrypt.github.io";

const wax = new waxjs.WaxJS({rpcEndpoint: "https://" + endpoint, tryAutoLogin: false});

const anchorTransport = new AnchorLinkBrowserTransport();
const anchorLink = new AnchorLink( { transport: anchorTransport, verifyProofs: true, chains: [ {chainId: chainId, nodeUrl: "https://"+endpoint} ] } );

ScatterJS.plugins( new ScatterEOS() );
const scatterNetwork = ScatterJS.Network.fromJson({ blockchain:"eos", chainId: chainId, host: endpoint, port: 443, protocol: "https" });

var wallet_type;
var wallet_session;

const wallet_isAutoLoginAvailable = async() => {
    var lastLogin = wallet_getLastLogin();

    if (lastLogin == "") {
        return false;
    } else if (lastLogin == "scatter") {
        wallet_type = lastLogin;
        return true;
    } else if (lastLogin == "anchor") {
        let sessionList = await anchorLink.listSessions(dapp);
        if (sessionList && sessionList.length > 0) {
            wallet_type = lastLogin;
            return true;
        } else {
            return false;
        }
    } else {
        wallet_type = lastLogin;
        return await wax.isAutoLoginAvailable();
    }
}

const wallet_selectWallet = (walletType) => {
    wallet_type = walletType;
}

const wallet_login = async() => {
    var wallet_userAccount;

    if (wallet_type == "anchor") {
        let sessionList = await anchorLink.listSessions(dapp);
        if (sessionList && sessionList.length > 0) {
            wallet_session = await anchorLink.restoreSession(dapp);
        } else {
            wallet_session = (await anchorLink.login(dapp)).session;
        }

        wallet_userAccount = String(wallet_session.auth);
    } else if (wallet_type == "scatter") {
        if (!await ScatterJS.scatter.connect(dapp, {scatterNetwork})) {
            throw {message:"Could not connect to wallet"};
        }

        await ScatterJS.scatter.login({accounts:[scatterNetwork]});
        let account = ScatterJS.scatter.identity.accounts.find(x => x.blockchain === "eos");
        wallet_session = ScatterJS.scatter.eos(scatterNetwork, Eos, { httpEndpoint: endpoint, expireInSeconds: 60 });
        wallet_userAccount = account.name + "@active";
    } else if (wallet_type == "cloud") {
        wallet_userAccount = await wax.login();
        wallet_userAccount += "@active";
        wallet_session = wax.api;
    }
    wallet_setLastLogin(wallet_type);
    return wallet_userAccount;
}

const wallet_logout = async() => {
    if (wallet_type == "anchor") {
        await anchorLink.clearSessions(dapp);
    } else if (wallet_type == "scatter") {
        await ScatterJS.scatter.logout();
    }
    wallet_setLastLogin("");
}

const wallet_transact = async(actions) => {
    if (wallet_type == "anchor") {
        try {
            var result = await wallet_session.transact( { actions:actions }, { blocksBehind: 3, expireSeconds: 30 } );
            return {transaction_id: result.processed.id};
        } catch(e) {
            if (e.hasOwnProperty("error") && e.error.hasOwnProperty("details") && Array.isArray(e.error.details) && e.error.details.length > 0) {
                throw ({message: e.error.details[0].message});
            } else {
                throw ({message: e.message});
            }
        }
    } else if(wallet_type == "scatter") {
		try {
            return await wallet_session.transaction( { actions:actions }, { blocksBehind: 3, expireSeconds: 30 } );
        } catch(e) {
            if (typeof e === "string") {
                e = JSON.parse(e);
            }

            if (e.hasOwnProperty("error") && e.error.hasOwnProperty("details") && Array.isArray(e.error.details) && e.error.details.length > 0) {
                throw ({message: e.error.details[0].message});
            } else {
                throw ({message: e.message});
            }
        }
	} else if (wallet_type == "cloud") {
        return await wallet_session.transact( { actions:actions }, { blocksBehind: 3, expireSeconds: 30 } );
    }

    return "Unknown wallet";
}

const wallet_getLastLogin = () => {
    if (typeof(Storage) === "undefined") {
        return "";
    } else {
        return localStorage.hasOwnProperty("lastLogin") ? localStorage.lastLogin : "";
    }
}

const wallet_setLastLogin = (lastLogin) => {
    if (typeof(Storage) !== "undefined") {
        localStorage.lastLogin = lastLogin;
    }
}
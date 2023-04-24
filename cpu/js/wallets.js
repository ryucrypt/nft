const chainId = "f16b1833c747c43682f4386fca9cbb327929334a762755ebec17f6f23c9b8a12";
const endpoint = "api.waxtest.alohaeos.com";
const dapp = "ryucrypt.github.io";

const wax = new waxjs.WaxJS({rpcEndpoint: "https://" + endpoint, tryAutoLogin: false});

const anchorTransport = new AnchorLinkBrowserTransport();
const anchorLink = new AnchorLink( { transport: anchorTransport, verifyProofs: true, chains: [ {chainId: chainId, nodeUrl: "https://"+endpoint} ] } );

async function wallet_isAutoLoginAvailable()
{
	var sessionList = await anchorLink.listSessions(dapp);
	if (sessionList && sessionList.length > 0)
	{
		wallet_type = "anchor";
		return true;
	}
	else
	{
		wallet_type = "cloud";
		return await wax.isAutoLoginAvailable();
	}
}

async function wallet_selectWallet(walletType)
{
	wallet_type = walletType;
}

async function wallet_login()
{
	if (wallet_type == "anchor")
	{
		/**var sessionList = await anchorLink.listSessions(dapp);
		if (sessionList && sessionList.length > 0)
		{
			wallet_session = await anchorLink.restoreSession(dapp);
		}
		else
		{
			wallet_session = (await anchorLink.login(dapp)).session;
		}**/
		wallet_session = (await anchorLink.login(dapp)).session;
		wallet_userAccount = String(wallet_session.auth);
	}
	else if (wallet_type == "cloud")
	{
		wallet_userAccount = await wax.login();
		wallet_userAccount += "@active";
		wallet_session = wax.api;
	}

	return wallet_userAccount;
}

async function wallet_logout()
{
	if (wallet_type == "anchor")
	{
		await anchorLink.clearSessions(dapp);
	}
}

async function wallet_transact(actions)
{
	if (wallet_type == "anchor")
	{
        try
        {
    		var result = await wallet_session.transact( { actions:actions }, { blocksBehind: 3, expireSeconds: 30 } );
	    	return {transaction_id: result.processed.id};
        }
        catch(e)
        {
            if (e.hasOwnProperty("error") && e.error.hasOwnProperty("details") && Array.isArray(e.error.details) && e.error.details.length > 0)
            {
                throw ({message: e.error.details[0].message});
            }
            else
            {
                throw ({message: e.message});
            }
        }
	}
	else if (wallet_type == "cloud")
	{
		return await wallet_session.transact( { actions:actions }, { blocksBehind: 3, expireSeconds: 30 } );
	}

	return "Unknown wallet";
}
/*
 * Copyright Ka-tet Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

/*
 * This application has 6 basic steps:
 * 1. Select an identity from a wallet
 * 2. Connect to the network gateway
 * 3. Access PaperNet network
 * 4. Construct request to redeem commercial paper
 * 5. Submit transaction
 * 6. Process response
 */

'use strict';

// Bring key classes into scope, most importantly Fabric SDK network class
const fs = require('fs');
const yaml = require('js-yaml');
const { Wallets, Gateway } = require('fabric-network');
const CommercialPaper = require('../contract/lib/paper.js');



// Main program function
async function main() {

    // A wallet stores a collection of identities for use
    const wallet = await Wallets.newFileSystemWallet('../identity/user/balaji/wallet');

    // A gateway defines the peers used to access Fabric networks
    const gateway = new Gateway();

    // Main try/catch block
    try {
        // Specify user name for network access
        const userName = 'balaji';

        // Load connection profile; will be used to locate a gateway
        let connectionProfile = yaml.safeLoad(fs.readFileSync('../gateway/connection-org1.yaml', 'utf8'));

        // Set connection options; identity and wallet
        let connectionOptions = {
            identity: userName,
            wallet: wallet,
            discovery: { enabled: true, asLocalhost: true }
        };

        // Connect to gateway using application specified parameters
        console.log('Connect to Fabric gateway');
        await gateway.connect(connectionProfile, connectionOptions);

        // Access PaperNet network
        const networkChannel = 'mychannel';
        console.log(`Use network channel: ${networkChannel}`);
        const network = await gateway.getNetwork(networkChannel);

        // Get addressability to commercial paper contract
        const contractNamespace = 'org.papernet.commercialcontract';
        const contractName = 'papercontract';
        console.log(`Use ${contractNamespace} smart contract`);
        const contract = network.getContract(contractName, contractNamespace);

        // Redeem commercial paper
        console.log('Submit commercial paper redeem transaction');
        const redeemResponse = await contract.submitTransaction('redeem', 'MagnetoCorp', '00001', 'DigiBank', 'Org2MSP', '2020-11-30');

        // Process response
        console.log('Process redeem tranaction response');
        let paper = CommercialPaper.fromBuffer(redeemResponse);
        console.log(`${paper.issuer} comercial paper : ${paper.paperNumber} successfully redeemed with ${paper.owner}`);
        console.log('Transaction complete!');
    } catch (error) {
        console.error(`Error processing transaction: ${error}`);
        console.error(error.stack);
    } finally {
        // Disconnect from the gateway
        console.log('Disconnect from Fabric gateway');
        gateway.disconnect();
    }
}

main().then(() => {
    console.log('Redeem program complete.');
}).catch((e) => {
    console.error('Redeem program exception.');
    console.error(e);
    console.error(e.stack);
    process.exit(-1);
});

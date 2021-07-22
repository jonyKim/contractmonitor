const Web3 = require('web3');
const axios = require('axios');

require("dotenv").config();

console.log(process.env.INFURA_ID);

// for infura
let web3ws = new Web3(new Web3.providers.WebsocketProvider(`wss://rinkeby.infura.io/ws/v3/${process.env.INFURA_ID}`, {
        // @ts-ignore
        clientConfig: {
            keepalive: true,
            keepaliveInterval: 60000	// milliseconds
        }
    }));
let web3 = new Web3(new Web3.providers.HttpProvider(`https://rinkeby.infura.io/v3/${process.env.INFURA_ID}`));

// for setting of ganache 
//let web3ws = new Web3(new Web3.providers.WebsocketProvider('ws://localhost:7545'));
//let web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:7545'));

class TransactionChecker {
    web3;
    web3ws;
    account;
    subscription;
    apiUrl;

    constructor(web3ws, web3, account, apiUrl) {
        this.web3ws = web3ws;
        this.web3 = web3;
        this.account = account;
        this.apiUrl = apiUrl;
    }

    subscribe(topic) {
        this.subscription = this.web3ws.eth.subscribe(topic, (err, res) => {
            if(err) console.log(err);
        });
    }

    watchTransactions() {
        console.log('Watching all pending transactions...');
        this.subscription.on('data', (txHash) => {
            //console.log(txHash);
            setTimeout(async () => {
                try {
                    let tx = await this.web3.eth.getTransaction(txHash);
                    if (tx != null) {
                        console.log(tx.from);

                        if(this.account === tx.to.toLowerCase()) {
                            console.log({
                                address: tx.from, value: this.web3.utils.fromWei(tx.value, 'ether'), timestamp: new Date()
                            });
                        }
                    }
                } catch (err) {
                    console.log(err);
                }
            }, 20000);
        });
    }

    allTransactionListWithAPI(address, apiKey, startblock = 0, endblock = 99999999) {
        axios({
            method:'get',
            url:`https://${this.apiUrl}.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=${startblock}&endblock=${endblock}&sort=asc&apikey=${apiKey}`
        }).then( (res) => {
            console.log(res.data);
        }).catch(error => {
            console.log(error);
        });
    }
}

let txChecker = new TransactionChecker(web3ws, web3, '0xa75463D53b74e48684E153707cc9A2469BBcCbcf', process.env.ETHSCAN_API_URL);

// 주기적으로 트랜잭션 확인
txChecker.subscribe('pendingTransactions');
txChecker.watchTransactions();

txChecker.allTransactionListWithAPI('YourAddress', process.env.INFURA_ID);

// axios 와 rinkeby api를 사용한 트랙잰션 히스토리 검사
// etherscan.io에 접속해서 회원 가입 후 API 발급받아 사용 가능

import puppeteer from "puppeteer";
import express from "express";
import cors from "cors";
import bp from "body-parser";


cors
({
    origin: 'http://localhost:3000/',
    allowedHeaders:
    [
        "Origin",
        "x-Requested-With",
        "Content-Type",
        "Accept",
        "Authorization"
    ],
    credentials: true,
    methods: "POST"
    
});

const port = 3000;
const app = express();
app.use(cors());
app.use(bp.json());
app.use(bp.urlencoded({ extended: true }));

var url ='https://api.binance.com/api/v1/ticker/24hr';
var currency = 'ETHBUSD'
var memory = 5;

var prices = [];


async function scrapePrice()
{
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url);
    const [element] = await page.$x('/html/body/pre');
    const context = await element.getProperty('textContent');
    var string = await context.jsonValue();
    await browser.close();
     
    // Parsing useful data (currency) to extract the price of Ethereum.
    string = string.substring(string.indexOf(currency));
    string = string.split("symbol")[0];
    string = string.replace(/"|,|:|{|}/g, '');
    string = string.substring(string.indexOf("lastPrice")+9);
    string = string.split("lastQty")[0];
    prices.push(parseFloat(string));
    

    if(prices.length > memory) // prevents storing too much data.
    {
        prices.shift();
    }

    await Promise.reject(new Error('scrapePrice'));
}

(function()
{
    app.post("/", (req, res) =>
        {
            console.log("Got pinged");

            res.json({
                currency: currency,
                prices: prices,
            });

            res.end();
        })
        app.listen(port, () => {console.clear(), console.log('Tuning in port 3000')})
})();


(async function loop()
{
    setTimeout(async function ()
    {
        await scrapePrice().catch(() => {});
        await loop();
        console.log(prices);
    }, 1000);
}());
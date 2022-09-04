const express = require('express');
const cors = require("cors");
const fs = require('fs');
const AdmZip = require('adm-zip');
const xml2js = require('xml2js');
const parser = new xml2js.Parser({ attrkey: "ATTR" });

const app = express();
app.use(cors());

const port = process.env.PORT || 8000;
let xmlFile;
let quantityOfItems = 0;
let namesOfProducts = [];
let namesOfItemsWithParts = [];

try {
  const zip = new AdmZip("./astra_export_xml.zip");
  zip.getEntries().forEach(entry => {
    if (entry.name === 'export_full.xml') {
      zip.extractEntryTo('export_full.xml', "./", true, true);
    }
  });
} catch (error) {
  console.log(`Extracting archive went wrong. ${error}`);
}

try {
  xmlFile = fs.readFileSync(`./export_full.xml`, "utf8");
} catch (error) {
  console.log(`Reading file went wrong. ${error}`);
}

parser.parseString(xmlFile, (error, data) => {
  if (!error) {
    quantityOfItems = data.export_full.items[0].item.length;

    for (let i = 0; i < quantityOfItems; i++) {
      namesOfProducts.push(data.export_full.items[0].item[i].ATTR.name);
    }

    const arrayOfProdWithParts = data.export_full.items[0].item.filter(el => el.parts != undefined);

    for (let i = 0; i < arrayOfProdWithParts.length; i++) {
      for (let j = 0; j < arrayOfProdWithParts[i].parts.length; j++) {
        let objectOfProducts = {
          part: '',
          item: []
        };
        objectOfProducts.part = arrayOfProdWithParts[i].parts[0].part[j].ATTR.name;

        for (let k = 0; k < arrayOfProdWithParts[i].parts[0].part[j].item.length; k++) {
          objectOfProducts.item.push(arrayOfProdWithParts[i].parts[0].part[j].item[k].ATTR.name);
        }

        namesOfItemsWithParts.push(objectOfProducts);
      }
    }
  } else {
    console.log(error);
  }
});

app.get('/first', (req, res) => {
  res.status(200).json(quantityOfItems);
});

app.get('/second', (req, res) => {
  res.status(200).json(namesOfProducts);
});

app.get('/third', (req, res) => {
  res.status(200).json(namesOfItemsWithParts);
});

app.listen(port, error => {
  if (error) console.log("Error in server setup")
});
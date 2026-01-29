// utils/csvReader.js
import fs from "fs";
import csv from "csv-parser";

export async function* readCsv(filePath) {
  if (!filePath) {
    throw new Error("CSV file path is undefined");
  }

  const stream = fs.createReadStream(filePath).pipe(csv());

  for await (const row of stream) {
    yield row;
  }
}

export async function readCsvHeaders(filePath) {
  return new Promise((resolve, reject) => {
    const stream = fs.createReadStream(filePath).pipe(csv());
    stream.once("headers", headers => resolve(headers));
    stream.once("error", reject);
  });
}


export async function readCsvWithHeaders(filePath) {
  const rows = [];
  let headers = [];

  await new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("headers", h => (headers = h))
      .on("data", row => rows.push(row))
      .on("end", resolve)
      .on("error", reject);
  });

  return { headers, rows };
}


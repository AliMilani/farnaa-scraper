import * as cheerio from "cheerio";

import confg from "./config";
import { convertPriceToInt, toChunks } from "./helpers";
import { writeFile } from "fs/promises";

type Product = {
  productName: string;
  productPrice: number;
  productImage: string;
  productLink: string;
};

const loadPage = async (url: string): Promise<cheerio.CheerioAPI> => {
  const data = await (await fetch(url)).text();
  return cheerio.load(data);
};

const getProducts = async (page: number): Promise<Product[]> => {
  const url = `https://farnaa.com/home/indexcolleauge?page=${page}`;
  const $ = await loadPage(url);

  const products: Product[] = [];

  $(".products .col-md-3.col-sm-4.col-6").each((index, element) => {
    const productName = $(element)
      .find(".product-info .title-box a")
      .text()
      .trim();
    const productPrice = convertPriceToInt(
      $(element).find(".pric ins span").first().text().trim()
    );
    const productImage = $(element).find(".pic-box img").attr("src") as string;
    const productLink = $(element)
      .find(".product-info .title-box a")
      .attr("href") as string;

    const product: Product = {
      productName,
      productPrice,
      productImage,
      productLink,
    };
    products.push(product);
  });
  return products;
};

const getTotalPages = async (): Promise<number> => {
  const url = `https://farnaa.com/home/indexcolleauge`;
  const $ = await loadPage(url);
  const pageNumbers = $(".pagination-box .item a.js-product-pager")
    .map((_, element) => {
      const page = $(element).attr("data-id");
      if (typeof page !== "string") throw new Error("page string");
      return parseInt(page);
    })
    .get();

  const totalPages = Math.max(...pageNumbers);
  return totalPages;
};

const getAllProducts = async (): Promise<Product[]> => {
  const totalPages = await getTotalPages();
  const pages: number[] = Array.from({ length: totalPages }, (v, k) => k + 1);

  const products: Product[] = [];

  const chunks: number[][] = toChunks<number>(pages, confg.concurrentPageLimit);

  for (const chunk of chunks) {
    const promises = chunk.map(getProducts);
    const chunkProducts = await Promise.all(promises);
    products.push(...chunkProducts.flat());
  }

  return products;
};

const csvExport = async (products: Product[]): Promise<string> => {
  const csv = products
    .map((product) => {
      return `${product.productName},${product.productPrice},${product.productImage},${product.productLink}`;
    })
    .join("\n");

  return csv;
};

(async () => {
  const products: Product[] = await getAllProducts();

  const sortedProducts: Product[] = products.sort((a, b) => {
    return a.productLink.localeCompare(b.productLink);
  });

  const csv: string = await csvExport(sortedProducts);
  await writeFile("products.csv", csv);
})();

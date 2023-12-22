export const convertPriceToInt = (priceStr: string) :number=> {
  const numericPart = priceStr.replace(/[^\d]/g, "");
  return parseInt(numericPart, 10);
};

export const toChunks = <T>(arr: T[], chunkSize: number): T[][] => {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += chunkSize) {
    result.push(arr.slice(i, i + chunkSize));
  }
  return result;
}
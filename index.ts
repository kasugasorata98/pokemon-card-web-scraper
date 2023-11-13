import puppeteer from "puppeteer";
import axios from "axios";
import * as fs from "fs";
import * as path from "path";

type PokemonCardDetail = {
  group: string;
  number: string;
  name: string;
  downloadLink: string;
};

async function downloadImage(pokemonCardDetail: PokemonCardDetail) {
  try {
    const response = await axios({
      method: "GET",
      url: pokemonCardDetail.downloadLink,
      responseType: "stream",
    });

    const destination = `./storage/${pokemonCardDetail.group}/${pokemonCardDetail.group}.${pokemonCardDetail.number}.${pokemonCardDetail.name}.png`;

    const destinationFolder = path.dirname(destination);

    // Create the destination folder if it doesn't exist
    if (!fs.existsSync(destinationFolder)) {
      fs.mkdirSync(destinationFolder, { recursive: true });
    }

    // Pipe the image stream to a file
    response.data.pipe(fs.createWriteStream(destination));
    console.log(`Downloading to ${destination}`);

    return new Promise<void>((resolve, reject) => {
      response.data.on("end", () => {
        resolve();
      });

      response.data.on("error", (err: any) => {
        reject(err);
      });
    });
  } catch (error) {
    throw error;
  }
}

async function run() {
  const browser = await puppeteer.launch({
    headless: "new",
  });

  const page = await browser.newPage();
  // 734
  for (let i = 0; i < 734; i++) {
    await page.goto(
      `https://pkmncards.com/page/${
        i + 1
      }/?s=type%3Apokemon&sort=abc&ord=auto&display=full`,
      {
        waitUntil: "networkidle2",
      }
    );

    let pokemonCardDetails = await page.$$eval(
      ".entry-content",
      (entryContentElements) => {
        const pokemonCardDetails: PokemonCardDetail[] = [];
        for (const entryContentElement of entryContentElements) {
          const title =
            entryContentElement.querySelector(
              ".card-title a span"
            )?.textContent;
          const regex = /\((.*?)\)/;
          const match = title!.match(regex);
          if (!match) continue;

          const numberString =
            entryContentElement.querySelector(".number a")?.textContent;
          const validNum = Math.max(
            1,
            Math.min(999, Number(numberString!.replace(/\D/g, "")))
          );

          const name = entryContentElement
            .querySelector(".name a")
            ?.textContent?.toLowerCase()
            .trim()
            .replace(" ", "_")
            .replace("-", "_")
            .replace(/\W/g, "")!; // remove all special chracters not including underscore

          pokemonCardDetails.push({
            group: match[1].toLowerCase(),
            number: validNum.toString().padStart(3, "0"),
            name,
            downloadLink: entryContentElement
              .querySelector('.image-meta a[title="Download Image"]')
              ?.getAttribute("href")!,
          });
        }
        return pokemonCardDetails;
      }
    );
    console.log(`Downloading Page: ${i + 1}`);
    pokemonCardDetails.map(async (pokemonCardDetail) => {
      try {
        await downloadImage(pokemonCardDetail);
      } catch (err) {
        console.error(`Error Page: ${i + 1}`);
        throw err;
      }
    });
  }

  await browser.close();
}

console.time("Download");
run().finally(() => {
  console.timeEnd("Download");
});

import puppeteer, { Browser } from "puppeteer";

// async function openPokemonCardPage(
//   abbreviationsAndLinks: PokemonAbbreviationsAndLinks[]
// ) {
//   const pokemonGroupPage = await browser.newPage();
//   await pokemonGroupPage.setRequestInterception(true);

//   // Intercept network requests
//   pokemonGroupPage.on("request", (request) => {
//     // Allow all non-image requests
//     if (!request.resourceType() || request.resourceType() !== "image") {
//       request.continue();
//       return;
//     }

//     // Block webp image requests
//     if (request.url().endsWith(".webp")) {
//       request.abort();
//     } else {
//       request.continue();
//     }
//   });

//   function formatNumber(num: number): string {
//     // Ensure the number is within the valid range (1 to 100)
//     const validNum = Math.max(1, Math.min(100, num));

//     // Convert the number to a string and pad with leading zeros
//     return validNum.toString().padStart(3, "0");
//   }

//   await pokemonGroupPage.goto(
//     abbreviationsAndLinks[0]!.link + "?display=full",
//     {
//       waitUntil: "networkidle2",
//     }
//   );
//   for (const abbreviationAndLink of abbreviationsAndLinks) {
//     await pokemonGroupPage.goto(abbreviationAndLink?.link + "?display=full", {
//       waitUntil: "networkidle2",
//     });
//     const result = await pokemonGroupPage.evaluate(() => {
//       const downloadImageLink = document.querySelectorAll(
//         '.entry-content a[title="Download Image"]'
//       );
//       //   const nameText = document
//       //     .querySelector(".name a")!
//       //     .textContent?.toLowerCase();

//       //   const number = document
//       //     .querySelector(".number a")!
//       //     .textContent?.toLowerCase();
//       //   return {
//       //     downloadImageHref: downloadImageLink
//       //       ? downloadImageLink.getAttribute("href")
//       //       : null,
//       //     nameText: nameText!.trim(),
//       //     number,
//       //   };
//     });

//     // console.log({
//     //   groupName: abbreviationAndLink?.groupName,
//     //   number: formatNumber(Number(result.number)),
//     //   name: result.nameText,
//     //   link: result.downloadImageHref,
//     // });
//   }
// }

// async function extractAbbreviationsAndLinks() {
//   const pokemonSetPage = await browser.newPage();

//   await pokemonSetPage.goto("https://pkmncards.com/sets/");
//   await pokemonSetPage.waitForSelector(".entry-content");
//   let pokemonCardSets = await pokemonSetPage.$$eval(
//     ".entry-content li a",
//     (anchors) =>
//       anchors.map((a) => {
//         const textContent = a.textContent;
//         if (textContent) {
//           const regex = /\((.*?)\)/;
//           const match = textContent.match(regex);
//           if (match && match[1]) {
//             return {
//               link: a.getAttribute("href"),
//               groupName: match[1].toLowerCase(),
//             };
//           }
//         }
//       })
//   );

//   pokemonCardSets = pokemonCardSets.filter(
//     (pokemonCardSet) => pokemonCardSet !== null
//   );
//   pokemonSetPage.close();
//   return pokemonCardSets;
// }

async function run() {
  const browser = await puppeteer.launch({
    headless: "new",
  });

  const page = await browser.newPage();

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
        const pokemonCardDetails = [];
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
          const validNum = Math.max(1, Math.min(100, Number(numberString)));

          pokemonCardDetails.push({
            group: match[1].toLowerCase(),
            number: validNum.toString().padStart(3, "0"),
            downloadLink: entryContentElement
              .querySelector('.image-meta a[title="Download Image"]')
              ?.getAttribute("href"),
          });
        }
        return pokemonCardDetails;
      }
    );

    console.log(pokemonCardDetails);
  }

  await browser.close();
}

run();

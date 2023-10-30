import "dotenv/config";
import axios from "axios";
import { load } from "cheerio";
import nodemailer from "nodemailer";
import { db } from "./firebase.js";
import { doc, getDoc, setDoc } from "firebase/firestore";

console.log("Server started!");

const scrape = async () => {
  console.log("Fetching...");

  // Define the structure of the article
  const latestArticle = { title: "", src: "", url: "" };

  // Fetch the website content and parse it with cheerio
  const url = "https://www.jw.org/ro/ce-e-nou/";
  const response = await axios(url, {
    transitional: {
      clarifyTimeoutError: true,
    },
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
  }).catch((err) => console.log(err));
  const $ = load(response.data);

  // Get the title of the latest article and remove new lines and spaces
  latestArticle.title = $("body")
    .find(
      "#article > div.whatsNewItems > div.synopsis.sqs.desc.first > div.syn-body.sqs > h3 > a"
    )
    .text()
    .replace("\n", "")
    .trim();

  // Get the source of the latest article, remove new lines, the spaces, turn it into lowercase and uppercase the first letter
  latestArticle.src = $("body")
    .find(
      "#article > div.whatsNewItems > div.synopsis.sqs.desc.first > div.syn-body.sqs > p.contextTitle"
    )
    .text()
    .replace("\n", "")
    .trim()
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());

  // Get the url of the latest article
  latestArticle.url = `https://jw.org/${$("body")
    .find(
      "#article > div.whatsNewItems > div.synopsis.sqs.desc.first > div.syn-body.sqs > h3 > a"
    )
    .attr("href")}`;

  console.log("Fetching done!");

  return latestArticle;
};

// Store the latest article in the database
const storeLastArticle = async (article) => {
  await setDoc(doc(db, "article", "latestArticle"), {
    title: article.title,
    src: article.src,
    url: article.url,
  });
};

// Send an email with the latest article, if it's different from the previous one
const sendEmail = async (article) => {
  const docRef = doc(db, "article", "latestArticle");
  const docData = await getDoc(docRef);
  if (article.url !== docData.data().url) {
    console.log("New article found!");
    console.log("Sending email...");
    console.log("cloud", article.url);
    console.log("local", docData.data().url);
    nodemailer
      .createTransport({
        host: "smtp.improvmx.com",
        port: 587,
        secure: false,
        auth: {
          user: process.env.EMAIL,
          pass: process.env.PASSWORD,
        },
      })
      .sendMail({
        from: process.env.EMAIL,
        to: process.env.RECIPIENTS.split(","),
        subject: `Articol nou în categoria ${article.src}`,
        html: `
          <p style="font-size: 20px;">
            A fost postat un nou articol cu titlul <span style="font-weight: bold;">${article.title}</span>
          </p>
          <p style="font-size: 16px;">Citește-l <a href=${article.url} style="font-size: 18px;">aici</a></p>
        `,
      })
      .then(() => {
        console.log("Email sent!");
      })
      .then(() => {
        storeLastArticle(article);
        console.log("Last article updated");
      })
      .catch((err) => {
        console.log(err);
      });
  } else {
    console.log("No new article. Still searching...");
  }
};

// Run the functions
const checkForNewArticle = async () => {
  await scrape().then((article) => {
    sendEmail(article);
  });
};

// Check for new articles every minute
setInterval(checkForNewArticle, process.env.TIMEOUT);

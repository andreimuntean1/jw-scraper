import 'dotenv/config'
import axios from "axios";
import { load } from "cheerio";
import nodemailer from "nodemailer";
import { db } from "./firebase.js";
import { doc, getDoc, setDoc } from "firebase/firestore";

// Define the structure of the article
const latestArticle = { title: "", src: "", url: "" };

const scrape = async () => {
  // Fetch the website content and parse it with cheerio
	const url = "https://www.jw.org/ro/ce-e-nou/";
	const response = await axios(url);
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
};

// Store the latest article in the database
const storeLastArticle = async () => {
	await setDoc(doc(db, "article", "latestArticle"), {
		title: latestArticle.title,
		src: latestArticle.src,
		url: latestArticle.url,
	});
};

// Send an email with the latest article, if it's different from the previous one
const sendEmail = async () => {
	const docRef = doc(db, "article", "latestArticle");
	const docData = await getDoc(docRef);
	if (latestArticle.url !== docData.data().url) {
		nodemailer
			.createTransport({
				service: "gmail",
				auth: {
					user: process.env.EMAIL,
					pass: process.env.PASSWORD,
				},
			})
			.sendMail({
				from: process.env.EMAIL,
				to: process.env.RECIPIENTS,
				subject: `Articol nou în categoria ${latestArticle.src}`,
				html: `
          <p style="font-size: 20px;">
            A fost postat un nou articol cu titlul <span style="font-weight: bold;">${latestArticle.title}</span>
          </p>
          <p style="font-size: 16px;">Citește-l <a href=${latestArticle.url} style="font-size: 18px;">aici</a></p>
        `,
			})
			.then((res) => {
				console.log(res);
			})
			.catch((err) => {
				console.log(err);
			});
	}
};

// Run the functions
const checkForNewArticle = async () => {
  await scrape().then(storeLastArticle).then(sendEmail);
}

// Check for new articles hourly
setInterval(checkForNewArticle, 1000 * 60 * 60);
import axios from "axios";
import { load } from "cheerio";
import nodemailer from "nodemailer";
import { db } from "./firebase.js";
import { doc, getDoc, setDoc } from "firebase/firestore";

const latestArticle = { title: "", src: "", url: "" };

const scrape = async () => {
	const url = "https://www.jw.org/ro/ce-e-nou/";
	const response = await axios(url);
	const $ = load(response.data);

	latestArticle.title = $("body")
		.find(
			"#article > div.whatsNewItems > div.synopsis.sqs.desc.first > div.syn-body.sqs > h3 > a"
		)
		.text()
		.replace("\n", "")
		.trim();
	latestArticle.src = $("body")
		.find(
			"#article > div.whatsNewItems > div.synopsis.sqs.desc.first > div.syn-body.sqs > p.contextTitle"
		)
		.text()
		.replace("\n", "")
		.trim()
		.toLowerCase()
		.replace(/^\w/, (c) => c.toUpperCase());
	latestArticle.url = `https://jw.org/${$("body")
		.find(
			"#article > div.whatsNewItems > div.synopsis.sqs.desc.first > div.syn-body.sqs > h3 > a"
		)
		.attr("href")}`;
};

const storeLastArticle = async () => {
	await setDoc(doc(db, "article", "latestArticle"), {
		title: latestArticle.title,
		src: latestArticle.src,
		url: latestArticle.url,
	});
};

const sendEmail = async () => {
	const docRef = doc(db, "article", "latestArticle");
	const docData = await getDoc(docRef).data();
	if (latestArticle.url !== docData.url) {
		nodemailer
			.createTransport({
				service: "gmail",
				auth: {
					user: "server@andreimuntean.dev",
					pass: "hgmkidqybeekhuhf",
				},
			})
			.sendMail({
				from: "server@andreimuntean.dev",
				to: "andreymuntean2004@gmail.com",
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

const checkForNewArticle = async () => {
  await scrape().then(storeLastArticle).then(sendEmail);
}

setInterval(checkForNewArticle, 1000 * 60 * 60);
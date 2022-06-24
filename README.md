
# JW Scraper

A web scraper for jw.org that fetches the last article posted and sends an email with the article's title and link



## Run Locally

Clone the project

```bash
  git clone https://github.com/andreimuntean1/jw-scraper.git
```

Go to the project directory

```bash
  cd jw-scraper
```

Install dependencies

```bash
  npm install
```

Create a .env file and add the following environment variables

```API_KEY```,
```AUTH_DOMAIN```,
```PROJECT_ID```,
```STORAGE_BUCKET```,
```MESSAGING_SENDER_ID```,
```APP_ID``` , as Firebase credentials

```EMAIL``` and ```PASSWORD``` , as Nodemailer email credentials

```RECIPIENTS``` , separated by commas

e.g. ```john.doe@example.com,jane.doe@example.com,richard.roe@example.com```


Start the server

```bash
  npm start
```


# RealEyes
A Simple RESTful API that encode .mp4 files to specific codec format and bitrate

## Installation
Clone the repository by running 
  ```sh
  $ git clone git@github.com:QUDUSKUNLE/RealEyes.git
  ```
Create environment variables file `.env` and copy `env.sample` keys
  ```sh
  $ cp env.sample .env
  ```
Download Google Service Account Credentials and move the key file to secrets direcotry inside services directory.
  1. Enable Google Drive API on GCP for access to read assets from Google Drive
  2. Enable Google Cloud Storage API to create storage buckets and accessiblity
  3. Put the downloaded Google Service Account Key in this directory `<HOME_DIRECTORY>/RealEyes/src/services/secrets`

Install dependencies.
```sh
$ npm install
```

Start RealEyes app.
```sh
$ npm run build
```

RealEyes app should be running on the specifiied `PORT` in `.env`.
```sh
$ RealEyes server running on port: {PORT}
```

Access available endpoints via
```sh
$ curl localhost:{PORT}/api/v1/info
```

Improvements
  1. Looking for a way to probe asset stream without saving the asset on the machine, incase if the asset is big, not efficient right now.
  2. Queue asset uploads to Google Cloud Storage

  

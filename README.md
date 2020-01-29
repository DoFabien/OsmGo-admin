OsmGo-admin is a webapp allowing to :
 - translate the interface of Osm Go!
 - translate and configure tags & presets of Osm Go!

## Technologies used
 - Angular 8 with Angular Material
 - Express
 - Web-socket (socket.io) to avoid conflict and to retrieve the changes instantly 
 - JWT for authentification ( through Oauth of Openstreetmap)

## Install
There is no data in this directory. 
You must configure the paths of the different files in _backend/config.json_ ( example : config.example.json)

The application will edit 2 json files : tags.json and presets.json (in src/assets/tagsAndPresets/ of Osm Go! repo) 
The application will log each change to refer to the authors

```sh 
## instal & start server
cd backend 
npm install
npm start #server.js
# expose 8080 port
```

```sh
## run frontend for dev
cd frontend
npm install
npm start # => http://localhost:4200/
```

## Documentation
Comming soon...






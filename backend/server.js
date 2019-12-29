const express = require("express");
const fs = require("fs-extra");
const bodyParser = require("body-parser");
const path = require("path");
const cookie = require("cookie");
const stringify = require("json-stringify-pretty-compact");
const rp = require("request-promise");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const cors = require("cors");
const cookieParser = require("cookie-parser");

const app = express();
const server = require("http").createServer(app);
const io = require("socket.io")(server, { path: "/api/ws" });

const jwt = require("jsonwebtoken");
const Config = JSON.parse(fs.readFileSync(path.join(__dirname, "config.json")));

const logsPath = Config.logPath

if( !fs.existsSync(logsPath)){
  fs.ensureFileSync(logsPath);
  fs.writeFileSync(logsPath, '[]', 'utf8')
}

let logs = fs.readJSONSync(logsPath);


const osmGoAssetsPath = Config.osmGoAssetsPath;

const JWTSECRET = Config.jwtSecret;
app.use(bodyParser.json());
app.use(cookieParser());
app.use(cors());

const presetsPath = path.join(osmGoAssetsPath, "tags&presets", "presets.json");
const i18nPath = path.join(osmGoAssetsPath, "i18n", "i18n.json");

const i18nLanguages = JSON.parse( fs.readFileSync(i18nPath), 'utf8').language;

const tagsPath = path.join(osmGoAssetsPath, "tags&presets", "tags.json");
const baseMapPath = path.join(osmGoAssetsPath, "tags&presets", "basemap.json");

let tagsConfig = fs.readJSONSync(tagsPath, "utf8");
let tags = tagsConfig.tags;
let presets = fs.readJSONSync(presetsPath, "utf8");
let basemaps = fs.readJSONSync(baseMapPath, "utf8");



const uiLanguagePath = path.join(osmGoAssetsPath, "i18n");
const svgIconsDirPath = Config.iconSVG;

let uiTranslations = {}

const getUiProgressTranslation = (lang) => {
  let progTarget = 0;
  let progRef = 0;
  const ref = uiTranslations['en'];
  const target = uiTranslations[lang];
  for (let cat in ref){
    for (let key in ref[cat]){
      progRef++;
      if (target[cat] && target[cat][key] && target[cat][key] !==''){
        progTarget++
      }
    }
  }
  return [progTarget, progRef]
}

for (let lang of i18nLanguages ){
    const codeLang = lang.code;
    const pathLCurrentLang = path.join(uiLanguagePath, `${codeLang}.json`);
    let str = fs.readFileSync(pathLCurrentLang, "utf8");
    uiTranslations[codeLang] = JSON.parse(str)
}


for (let codeLang in uiTranslations){
  let curentConfigLang = i18nLanguages.find( c => c.code == codeLang);
  if (curentConfigLang){
    curentConfigLang['progress'] = getUiProgressTranslation(codeLang);
  }
}


console.log("http://localhost:8080");
server.listen(8080);

const addLog = (_type, data) => {
  logs = [{_type, ...data}, ...logs];
  fs.writeFile( logsPath, stringify(logs), 'utf8')
    .then()
}



io.on("connection", async socket => {
  let cookies = cookie.parse(socket.request.headers.cookie);
  const jwt =cookies && cookies.jwt_access_token ? cookies.jwt_access_token : null;
});

const error = (res, error) => {
  res.setHeader("Content-Type", "application/json");
  res.status(500).send({ error });
};
app.get("/", function(req, res) {
  res.setHeader("Content-Type", "application/json");
  res.send({ text: "Hello :-)" });
});

app.get("/api/i18n", async (req, res) => {
    res.send(i18nLanguages)
});

const veritfyJWT = jwtToken => {
  if (!jwtToken) {
    return null;
  }
  let user = null;
  try {
    user = jwt.verify(jwtToken, JWTSECRET);
  } catch (err) {
    console.log("JWT error", err);
    return null;
  }
  return user;
};

app.get("/api/OsmGoTags/", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(tags);
});

app.get("/api/OsmGoPresets/", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(presets);
});

app.get("/api/OsmGoBaseMaps/", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(basemaps);
});

app.get("/api/svgList", function(req, res) {
  let excludeName = ["Create", "Delete", "Update", "arrow-position"];

  fs.readdir(svgIconsDirPath)
    .then(filesname => {
      res.send(
        filesname
          .filter(name => path.parse(name).ext == ".svg")
          .map(name => path.parse(name).name)
          .filter(name => excludeName.indexOf(name) == -1)
      );
    })
    .catch(err => {
      res.send(error(res, err));
    });
});

app.get("/api/svg/:name", function(req, res) {
  res.setHeader("Content-Type", "image/svg+xml; charset=UTF-8");
  let fileName = req.params.name;
  fs.readFile(path.join(svgIconsDirPath, `${fileName}.svg`), "utf8")
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.send(error(res, err));
    });
});

// change tagConfig
app.post("/api/tag/", async (req, res) => {
  const jwt =
    req.cookies && req.cookies.jwt_access_token
      ? req.cookies.jwt_access_token
      : null;
  res.setHeader("Content-Type", "application/json");
  const user = veritfyJWT(jwt);
  if (!user) {
    res.status(401).send("unautorized");
    return;
  }
  let data = req.body;

  // todo => from tags
  const pkey = data.tagConfigId.split("/")[0];

  data["pkey"] = pkey;
  data["userId"] = user.id;
  data["time"] = new Date().getTime();
  let currentTagConfig = tags.find(o => o.id === data.tagConfigId);

  if (
    data.key === "lbl" ||
    data.key === "description" ||
    data.key === "terms" ||
    data.key === "alert" ||
    data.key === "warning"
  ) {
    if (!currentTagConfig[data.key]) {
      currentTagConfig[data.key] = { en: "" };
    }
    currentTagConfig[data.key][data.language] = data.newValue;
    io.emit("updateTagConfig", data);
  } else {
    // TODO : presets exits && isarray []
    currentTagConfig[data.key] = data.newValue;
    addLog('updateTagConfig', data);
    io.emit("updateTagConfig", data);
  }

  fs.writeFileSync(tagsPath, stringify(tagsConfig), 'utf8')
  res.send({ status: "ok" });
});

app.delete("/api/tag/", async (req, res) => {
  const jwt =
    req.cookies && req.cookies.jwt_access_token
      ? req.cookies.jwt_access_token
      : null;
  res.setHeader("Content-Type", "application/json");
  const user = veritfyJWT(jwt);
  if (!user) {
    res.status(401).send("unautorized");
    return;
  }
  let data = req.body;

  data["userId"] = user.id;
  data["time"] = new Date().getTime();

  tags = tags.filter(t => t.id !== data.tagId);

  fs.writeFileSync(tagsPath, stringify(tagsConfig), 'utf8')
  res.send({ status: "ok" });
  addLog("deleteTagConfig", data);
  io.emit("deleteTagConfig", data);
});

app.post("/api/preset/", async (req, res) => {
  const jwt =
    req.cookies && req.cookies.jwt_access_token
      ? req.cookies.jwt_access_token
      : null;
  res.setHeader("Content-Type", "application/json");
  const user = veritfyJWT(jwt);
  if (!user) {
    res.status(401).send("unautorized");
    return;
  }
  let data = req.body;
  data["userId"] = user.id;
  data["time"] = new Date().getTime();

  let currentPreset = presets[data.presetId];

  if (data.key === "lbl" || data.key === "type") {
    currentPreset[data.key][data.language] = data.newValue;
  } else {
    // on envoie tout pour l'instant,
    currentPreset[data.key] = data.newValue;
  }
  fs.writeFileSync(presetsPath, stringify(presets), 'utf8')
  io.emit("updatePresetConfig", data);
  addLog('updatePresetConfig', data);
  res.send({ status: "ok" });
});

app.delete("/api/preset/", async (req, res) => {
  const jwt =
    req.cookies && req.cookies.jwt_access_token
      ? req.cookies.jwt_access_token
      : null;
  res.setHeader("Content-Type", "application/json");
  const user = veritfyJWT(jwt);
  if (!user) {
    res.status(401).send("unautorized");
    return;
  }
  let data = req.body;

  data["userId"] = user.id;
  data["time"] = new Date().getTime();
  const presetId = data["presetId"];

  // delete presetId from tags

    for (let tag of tags) {
      if (tag.presets.includes(presetId)) {
        const newPresets = tag.presets.filter(p => p !== presetId);
        tag.presets = newPresets;
        let dataToEmit = {
          ...data,
          newValue: newPresets,
          key: "presets",
          tagConfigId: tag.id
        };
        io.emit("updateTagConfig", dataToEmit);
      }
    }
  

  if (presets[data["presetId"]]) {
    delete presets[data["presetId"]];
    addLog("deletePresetConfig", data);
    io.emit("deletePresetConfig", data);
  }

  fs.writeFileSync(presetsPath, stringify(presets), 'utf8')
  fs.writeFileSync(tagsPath, stringify(tagsConfig), 'utf8')

  res.send({ status: "ok" });

});

app.post("/api/tag/", (req, res) => {
  const user = veritfyJWT(req.headers.authorization);
  if (!user) {
    res.status(401).send("unautorized");
    return;
  }

  res.setHeader("Content-Type", "application/json");
  const data = req.body;

  let currentTagConfig = tags.find(o => o.id === data.tagConfigId);
  res.send("ok");

  if (
    data.key === "lbl" ||
    data.key === "description" ||
    data.key === "terms"
  ) {
    if (!currentTagConfig[data.key]) {
      currentTagConfig[data.key] = { en: "" };
    }
    currentTagConfig[data.key][data.language] = data.newValue;
    fs.writeFileSync(tagsPath, stringify(tagsConfig), "utf8");
  }
});

/* UI TRANSLATION */
app.get("/api/UiTranslation/:language/", async (req, res) => {
  let language = req.params.language;
  res.send(uiTranslations[language]);
});

app.post("/api/UiTranslation/", async (req, res) => {
    const jwt =
    req.cookies && req.cookies.jwt_access_token
      ? req.cookies.jwt_access_token
      : null;
  res.setHeader("Content-Type", "application/json");
  const user = veritfyJWT(jwt);

  if (!user) {
    res.status(401).send("unautorized");
    return;
  }

  const data = req.body;
  data["userId"] = user.id;
  data["time"] = new Date().getTime();

  if (uiTranslations[data.language]){
    if (!uiTranslations[data.language][data.category]){
        uiTranslations[data.language][data.category] = {};
    }
    uiTranslations[data.language][data.category][data.key] = data.newValue
    res.send({satus:'ok'});
    const pathLCurrentLang = path.join(uiLanguagePath, `${data.language}.json`);
    addLog("updateUiTranslation", data)

    let curentConfigLang = i18nLanguages.find( c => c.code == data.language);
    if (curentConfigLang){
      curentConfigLang['progress'] = getUiProgressTranslation(data.language);
    }

    io.emit("updateUiTranslation", data);
    fs.writeFileSync(pathLCurrentLang, stringify(uiTranslations[data.language]), "utf8");
  } else {
    res.status(404).send("oops");
  }
 
});

const getUserFromOsmTokens = async (token, token_secret) => {
  const body = await rp({
    url: "https://www.openstreetmap.org/api/0.6/user/details",
    method: "GET",
    oauth: {
      consumer_key: "v2oE6nAar9KvIWLZHs4ip5oB7GFzbp6wTfznPNkr", // Supply the consumer key, consumer secret, access token and access secret for every request to the API.
      consumer_secret: "1M71flXI86rh4JC3koIlAxn1KSzGksusvA8TgDz7",
      token: token,
      token_secret: token_secret
    },
    headers: {
      "content-type": "text/xml" // Don't forget to set the content type as XML.
    }
  });
  const dom = new JSDOM(body);

  const u = dom.window.document.getElementsByTagName("user")[0];

  const user = {
    display_name: u.getAttribute("display_name"),
    id: u.getAttribute("id")
  };
  const jwttoken = jwt.sign(user, JWTSECRET);
  return { ...user, jwt: jwttoken };
};

app.get("/api/auth/", async (req, res) => {
  const token = req.query.token.replace(/"/g, "");
  const token_secret = req.query.token_secret.replace(/"/g, "");
  const user = await getUserFromOsmTokens(token, token_secret);
  res.setHeader("Content-Type", "application/json");
  res.send(user);
});

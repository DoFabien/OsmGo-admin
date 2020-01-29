. deploy.config

echo $serverHost
echo $serverPort
echo $serverPathFrontend
echo $serverPathBackend
echo $serverOsmGoAdminAssets

echo $assetsOsmGoPath


ssh -p $serverPort $serverUser@$serverHost "
mkdir -p $serverPathFrontend
mkdir -p $serverPathBackend
mkdir -p $serverOsmGoAdminAssets/IconsSVG
mkdir -p $serverOsmGoAdminAssets/i18n
mkdir -p $serverOsmGoAdminAssets/tagsAndPresets
"

cd ./frontend
npm run build --prod

rsync -e "ssh -p $serverPort" -avz ./dist/ $serverUser@$serverHost:$serverPathFrontend


rsync -e "ssh -p $serverPort" -avz   $localOsmGoPath/src/assets/i18n/ $serverUser@$serverHost:$serverOsmGoAdminAssets/i18n/
rsync -e "ssh -p $serverPort" -avz   $localOsmGoPath/src/assets/tagsAndPresets/ $serverUser@$serverHost:$serverOsmGoAdminAssets/tagsAndPresets/
rsync -e "ssh -p $serverPort" -avz   $localOsmGoPath/resources/IconsSVG/ $serverUser@$serverHost:$serverOsmGoAdminAssets/IconsSVG/


## BACKEND
cd ../backend
ls
rsync -e "ssh -p $serverPort" --exclude=node_modules --exclude=tmp --exclude=config.json --exclude=*.git -avz   ./ $serverUser@$serverHost:$serverPathBackend

ssh -p $serverPort $serverUser@$serverHost "
cd $serverPathBackend
npm install
pm2 delete osmgo-admin
pm2 start server.js --name osmgo-admin
"
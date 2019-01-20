sudo kill `ps -ef | grep 'node ./app.js' | grep -v -e grep -e sudo | awk '{print $2}'`

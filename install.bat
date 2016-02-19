call npm install
call cd node_modules/sqlite3
call npm install nan@~2.1.0
call npm run prepublish
call node-gyp configure --module_name=node_sqlite3 --module_path=../lib/binding/node-v46-win32-x64
call node-gyp rebuild --target=0.35.6 --arch=x64 --target_platform=win32 --dist-url=https://atom.io/download/atom-shell --module_name=node_sqlite3 --module_path=../lib/binding/node-v46-win32-x64
cd ../../
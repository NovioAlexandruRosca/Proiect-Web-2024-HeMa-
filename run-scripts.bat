rem run-scripts.bat

rem Run scheduler.js in the background
start node scripts\scheduler.js

rem Wait for a moment to ensure the scheduler script starts
timeout /t 2

rem Run the server
start npx nodemon ./scripts/server.js

rem Wait for a moment to ensure the server starts
timeout /t 2

start http://localhost:5500/
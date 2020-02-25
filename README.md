# iot

Routet

GET url+"/"+aika -> palauttaaa aikavälin  < tämähetki-aika -- tämähetki > väliset rivit

GET url+"/0" -> palauttaa viimeisimmän rivin

POST url + "?" + state + "&" + aika -> asettaa staten 0/1 (jos 0 aika voi olla undefined-> insert row state 0 + shutdown) muulloin -> insert row state = 1, timer = X-aika. ( X on maksimi aika ajastimelle esim 2h)

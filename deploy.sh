CURRENT=stockboard
PAGE_DIR=stockboardpage
grunt build
cp -r dist/ ../$PAGE_DIR
cd ../$PAGE_DIR
git add -u
git add scripts/
git commit
git push origin gh-pages
cd ../$CURRENT

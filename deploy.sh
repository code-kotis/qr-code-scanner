git checkout -B gh-pages
git add -f dist -n
git commit -am "Deployed website" -n
git filter-branch -f --prune-empty --subdirectory-filter dist
git push -f origin gh-pages -n
git checkout -

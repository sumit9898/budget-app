# reclaim ownership (root-owned files from earlier sudo runs cause this)
sudo chown -R "$(id -un)":"$(id -gn)" .

# remove any immutable/read-only flags (rare, but quick to clear)
sudo chflags -R nouchg,noschg .

# guarantee write/execute for you
chmod -R u+rwX .

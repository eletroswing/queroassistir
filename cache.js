import fs from 'fs';

function cache(filePath= "./cache.json") {
    var memory = {}
    if (fs.existsSync(filePath)) {
        const fileData = fs.readFileSync(filePath, 'utf8');
        memory = JSON.parse(fileData);
    }

    const save = () => fs.writeFileSync(filePath, JSON.stringify(memory, null, 2));

    const set = (key, value, ttl = 0) => {
        const expireAt = ttl > 0 ? Date.now() + ttl * 1000 : null;
        memory = { ...memory, [key]: { value, expireAt } };
        save()
        return;
    }

    const get = (key) => {
        const entry = memory[key];
        if (!entry) return null;

        if (entry.expireAt && Date.now() > entry.expireAt) {
            return null;
        }

        return entry.value;
    }

    const del = (key) => {
        delete memory[key];
        save()
    }

    const exp = () => {
        const now = Date.now();
        const newCache = Object.fromEntries(
            Object.entries(memory).filter(
                ([_, { expireAt }]) => !expireAt || now <= expireAt
            )
        );
        save()
        return newCache;
    }

    return {
        set,
        get,
        del,
        exp
    }
}

export default cache;
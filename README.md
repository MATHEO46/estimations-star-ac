# Estimations Star Ac

Site public d'estimations Star Ac avec votes et classement partage.

## Modifier les candidats

Les candidats sont dans `server.js`, dans la liste `candidates`.

Exemple :

```js
const candidates = [
  { name: 'Prenom 1', color: '#f5c756' },
  { name: 'Prenom 2', color: '#e75884' },
];
```

## Lancer le site

```bash
npm start
```

Le site s'ouvre ensuite sur `http://127.0.0.1:4173/`.

Cette adresse locale marche seulement sur l'ordinateur qui lance le site. Pour ouvrir le site sur telephone, Chrome, Safari, Edge ou un autre navigateur, il faut une adresse publique apres hebergement.

## Mettre en ligne 24h/24

Le projet est pret pour un hebergement Node.js comme Render ou Railway.

Sur Render :

1. Cree un compte Render.
2. Mets ce dossier sur GitHub.
3. Dans Render, choisis "New Web Service".
4. Connecte le depot GitHub.
5. Render detectera `render.yaml`.
6. Lance le deploiement.

Le fichier `render.yaml` demande le nom `estimations-star-ac`. Si ce nom est disponible, l'adresse publique pourra ressembler a :

```text
https://estimations-star-ac.onrender.com
```

Le fichier `render.yaml` utilise une instance gratuite.

Important : en mode totalement gratuit, les votes peuvent etre remis a zero si l'hebergeur redemarre le service ou si le site est redeploye. Pour garder les votes durablement sans risque, il faudrait une base de donnees persistante, souvent payante apres les limites gratuites.

## Utiliser estimations-star-ac.com

Pour utiliser l'adresse :

```text
https://estimations-star-ac.com
```

Il faut acheter le nom de domaine `estimations-star-ac.com`, puis le connecter a l'hebergement.

Sur Render, apres le deploiement :

1. Ouvre le service `estimations-star-ac`.
2. Va dans "Settings", puis "Custom Domains".
3. Ajoute `estimations-star-ac.com`.
4. Render donnera des valeurs DNS a copier chez le vendeur du domaine.
5. Chez le vendeur du domaine, ajoute les entrees DNS demandees par Render.
6. Attends la validation DNS et le certificat HTTPS.

Quand tout est valide, le site sera accessible depuis telephone, Chrome, Safari, Edge et autres navigateurs avec :

```text
https://estimations-star-ac.com
```

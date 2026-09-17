# Mettre LSPD Procédures en ligne sur le VPS (à côté de Kaelo Hub)

Ce guide respecte les règles du VPS partagé avec **Kaelo Hub**. Il ne touche à rien de Kaelo : pas de port publié, pas de modification de `/srv/infra`, et aucune commande Docker en dehors de `/opt/lspd-procedures`.

| Élément | Nom utilisé |
| --- | --- |
| Dossier | `/opt/lspd-procedures/` |
| Projet Docker | `lspd-procedures` (défini dans `.env`) |
| Conteneur et alias sur `edge` | `lspd-procedures-web` (port interne 3000) |
| Volume des données | `lspd-procedures_lspd-data` |
| Mémoire max | 384 Mo |

## 1. Un domaine à toi

Il te faut ton **propre** domaine : pas `kaelohub.duckdns.org`, ni un chemin dessous. Le plus simple est un nouveau sous-domaine gratuit sur **duckdns.org**, par exemple `lspd-procedures.duckdns.org`, qui pointe vers l'IP du VPS.

## 2. Récupérer le site sur le VPS

Le code est sur GitHub, dans un dépôt public : pas de clé ni de mot de passe à gérer.

```bash
sudo git clone https://github.com/Jacob6254/lspd-procedures.git /opt/lspd-procedures && cd /opt/lspd-procedures
```

Si `git` n'est pas installé : `sudo apt install -y git`.

## 3. Démarrer le site

Toujours depuis `/opt/lspd-procedures` :

```bash
docker compose up -d --build
```

La première fois, ça prend 2 à 3 minutes. Pour vérifier que ça tourne :

```bash
docker compose ps
```

Le conteneur `lspd-procedures-web` doit être `Up` puis `(healthy)`.

## 4. Brancher le domaine dans le Caddy partagé

Le Caddyfile du serveur est une **copie** du fichier `infra/Caddyfile` du dépôt Kaelo, donc on ne l'édite pas sur le serveur.

1. Ajoute le contenu de `Caddyfile.bloc-lspd` à la fin de `infra/Caddyfile` **dans le dépôt Kaelo**, avec ton vrai domaine.
2. Déploie ce fichier comme d'habitude pour Kaelo (copie avec `cp` par-dessus `/srv/infra/Caddyfile`, jamais `mv` ni `sed -i`).
3. Recharge Caddy **sans le redémarrer** :

```bash
cd /srv/infra && docker compose exec caddy caddy validate --config /etc/caddy/Caddyfile && docker compose exec caddy caddy reload --config /etc/caddy/Caddyfile
```

Si `validate` affiche une erreur, ne recharge pas et corrige d'abord le bloc.

## 5. Créer ton compte tout de suite

Va sur `https://ton-domaine`. La première visite affiche **« Créer le compte administrateur »** : crée ton compte **immédiatement**, avant de partager le lien.

Ensuite, dans **Réglages → Comptes des collègues**, crée le compte de ton collègue.

---

## Au quotidien (toujours depuis `/opt/lspd-procedures`)

**Mettre à jour le site** quand je pousse une nouvelle version :

```bash
cd /opt/lspd-procedures && sudo git pull && docker compose up -d --build
```

Les dossiers, screens et comptes restent dans le volume Docker, ils ne sont pas touchés.

**Sauvegarder** les dossiers, screens et comptes :

```bash
cd /opt/lspd-procedures && docker compose cp lspd-procedures-web:/data ./sauvegarde-$(date +%F)
```

**Voir les erreurs :**

```bash
cd /opt/lspd-procedures && docker compose logs --tail 50
```

**Arrêter le site** (sans supprimer les données) :

```bash
cd /opt/lspd-procedures && docker compose down
```

## À ne jamais faire sur ce VPS

- `docker compose down -v`, `docker volume prune`, `docker system prune --volumes`, `docker network prune`
- toucher à `/opt/kaelo-hub`, `/srv/infra`, `/srv/secrets`, ou à un conteneur `kaelo…` ou `infra-caddy`
- ajouter une ligne `ports:` dans `docker-compose.yml`

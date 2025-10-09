# pos-cli

Un projet personel visant à recréer un logiciel de caisse enregistreuse (Point de Vente) dans le terminal en étant le plus conforme possible à la norme NF525

## Usage

Pour commencer, [téléchargez la dernière version de poscli.](https://github.com/guilhemdemarco/pos-cli/releases/latest)

Ensuite, lancer l'executable dans le terminal de commandes
> [!NOTE]
> Au premier lancement, vous aurez peut-être une erreur 
> 
>`ENOENT: no such file or directory, open 'data/products.json'`
> 
> Ce n'est pas grave, relancez l'executable et l'erreur partira

### Ouvrir la journée
Avant d'enregistrer des ventes, un administrateur doit ouvrir la journée, puis fermer la journée à la fin du jour.

Connectez vous en tant qu'administrateur:
```
Nom d'utilisateur: admin
Mot de passe: admin123
```

Une fois connecté, vous aurez accès au menu principal. Sélectionnez "Ouvrir la journée" pour commencer. La journée est maintenant ouverte. Vous pouvez soit rester connecté sur ce compte, ou vous déconnecter en sélectionnant "Quitter", puis vous connecter sur un compte de caissier.

```
Nom d'utilisateur: cashier1
Mot de passe: cashier123
```

Quelque soit votre choix, vous pouvez sélectionner "Démarrer une vente" pour commencer à vendre vos produits.

### Vente de produits
En sélectionnement l'option "Démarrer une vente" vous entrerez en mode caissier. 

Ici, vous pouvez rentrer des commandes en commençant par `:`, ou rentrer le code d'un produit directement pour le rentrer dans le panier.

Commencez par rentrer la commande `:list` ou `:li` en plus court. Cette commande vous montre tous les produits enregistrés. Vous pouvez voir le nom, le prix, le stock, et le code de chaque produit. Sélectionnez le produit que vous souhaitez avec les flèches de votre clavier et appuyez sur la touche Entrer pour l'ajouter dans le panier.

Lorsque que vous avez les produits que vous voulez dans le panier, tapez `:checkout` ou `:co` pour acheter ces produits.

#### Commandes
* `:checkout` / `:co` - Finaliser la vente et traiter le paiement
* `:cancel` - Annuler la vente en cours
* `:rm` [#article] - Retirer un article du panier
* `:list` / `:li` - Selectionner un article via une liste
* `:set` <quantité> [#article] - Modifier la quantité d'un article
* `:help` - Afficher ce message d'aide
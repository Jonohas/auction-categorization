## additional prompts
Make sure to use bun for everything
## Functionality
- website scraper service that can be triggered with an endpoint
- A local sqlite3 database that stores the scraped data
- A tabbed page that has tabs per scraped website
- A tab should list all the auctions within the website
- clicking on an auction should display all items in that auction

## Stack
- bun as a backend
- use the bun native sqlite interface
- react frontend with tanstack start
- use prisma for all database related stuff.

### Scraped auctions format
- url to the auction page, the name of the scraped website we got it from
- a probability for if this auction is computer hardware/server related.
- when this auction starts
- when this auction is finished
### Scraped auction item/lots format
- url to the auction item
- probablity of if this item is likely to be a server/ computer hardware related item
- url to the item image if present
- current price
- how many bids
- 

## How it all ties together
I want multiple pages, with a simple top bar navigation
- Scraping page
	- In this page i can add or remove websites that should be scraped
	- i want to see a list of all the to scrape websites including a icon that may be the favicon or icon found on the homepage
	- at the top i want a simple input for adding the page, which should be a form that can be submitted via the enter key or a submit button with a good description
	- auctions that have already been scraped, do not need to be scraped again.
- auction page
	- Lets me see all the auctions that exist
	- filter based on the website where the auction was found
	- filter based on probability of being computer hardware or server related
	- a searchbar that lets me search the titles of the auctions
	- sorting based on the probability of being computer hardware or server related
- All probabilities need to go through a llm model that returns a json of the probabilities
	- based on description, title or the image itself.
- a toml config file that lets me define: 
	- which ai model should be used.
	- i am thinking of urls, secrets etc to access the ai model.
	- intervals of scraping.

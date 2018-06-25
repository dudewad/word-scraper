# Setting up the project

Open a command prompt in the root directory of this project, and run the following command:

`npm install`

It'll do a bunch of stuff. You also need to have the `http-server` installed. That's easy, too.
In the same command prompt, just run:

`npm install -g http-server`

Then you're done!

# Using the scraper

To use the scraper, you have to tell it where to look for information, and it needs to know where
to put files when it's done. Telling it these things is done with a configuration file.

## The config file

The config file is a .json file (JSON is a data format). There's an example file that is called
`config.example.json` in the root of the project. Copy and paste it to make new configurations.

The config file has two sections: an `output` section and an `items` section. The `output` section
tells the scraper where to put files when it's done (as mentioned above). The `items` section
explains to the scraper what to get, where to get it from, and what to call it when it's done.

The `output` section is optional. It defaults to telling the scraper to put all files in the `out`
base directory. If you aren't creating multiple sets of data, you don't need this section and
can ignore it entirely.

If you want to specify a specific/custom output directory, you need to tell the scraper where that
is by using the `output.baseDir` property. An example is below:

```JSON
{
  "output": {
    "baseDir": "custom-directory"
  },
  "items": []
}
```

Specifying items is simple if you aren't going to change the configuration on how it selects
items from the pages you're scraping (this will be updated later to explain how to do that).

The `items` object is a list of items (it's called an `Array`). This list tells the scraper on a 
per-page basis what to retrieve for parsing. Each `item` is an object with three properties:
`url`, `name`, and `contexts`. You can ignore contexts for now, as it's more complicated than
the others.

The `url` property is just the url of the page you want to scrape. Pretty straight forward, but
make sure that it includes the `http://` portion of the url.

The `name` property needs to be unique, as it tells the scraper what the scraped content is called
and actually is what is used to generate the file name. Duplicate names will result in breakage.

An example of this configuration is below:

```JSON
{
  "output": {
    "baseDir": "custom-directory"
  },
  "items": [
    {
      "name": "RA - Peru Campeon",
      "url": "http://radioambulante.org/transcripcion/transcripcion-peru-campeon",
      "contexts": [
        {
          "parent": ".article-body",
          "exclude": [
            "iframe",
            ".fb-comments",
            "h3"
          ]
        }
      ]
    },
    {
      "name": "RA - poi",
      "url": "http://radioambulante.org/transcripcion/transcripcion-jaz-y-lalay",
      "contexts": [
        {
          "parent": ".some-element",
          "exclude": [
            ".ac-1",
            ".element-seven"
          ]
        }
      ]
    }
  ]
}
```

These files are picky, so if you have an out-of-place comma or don't put things in double quotes,
it'll break. Keep that in mind.

# Generating the output

Once your configuration file is ready, you need to run the scraper to generate the data from the websites that you added
to the configuration.

You do this by opening a command prompt in the root directory of the project, and running the main script, feeding it
your new configuration file. For instance, if you made a config file called `my-config-file.json`, then your command
would be:

`node main -c my-config-file.json`

This shouldn't take too long to run. Once it finishes, if you open the project directory you should see your directory
with your output data in it at the location you specified in your config file's `out.baseDir` property (see the
configuration section for more on that).

# Viewing the output

To view the output you need to start the http-server that you installed in the getting started section.

This is simple. Open a command prompt in the root directory for this project, and run the following command:

`http-server`

It will tell you the URL that your server is running on. You can open this URL in your web browser and it
should work out of the box!

## Viewing custom output

If you changed your config to output files to a different output directory than the default `out` directory,
you can tell the viewing webpage to look in a different place by modifying the url.

For example, lets say you made a custom configuration to output data files to `my-custom-directory`.

Normally you'll be visiting `http://localhost:8081` in your browser to view it. You'll need to change that to:

`http://localhost:8081?base=my-custom-directory`

That should take care of it all on its own.
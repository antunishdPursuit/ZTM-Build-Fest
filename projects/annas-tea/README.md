# Anna's Tea

Learn how prices, sales and costs affect a small tea shop's profit. Follow a normal day, compare a promotion and change the assumptions yourself.

For beginners, more sales can look like success even when discounts and costs leave less profit. This illustrated lesson connects those numbers through a worked example and an editable experiment.

## Development

Requires Node.js 22 or later. No dependency installation is needed.

```sh
cd projects/annas-tea
npm start
npm test
```

Open http://127.0.0.1:4173 after starting the server. Stop it with Ctrl+C.
For a different port, set the `PORT` environment variable before starting.
For static hosting, serve this folder with relative asset/module paths; there is no build step or backend API.

The optional monthly estimate uses 26 identical trading days. Changing experiment inputs marks the previous result outdated until another run. No account, analytics, external API, runtime AI or saved business data is used. Refreshing returns to welcome. See [pages.md](pages.md) for screen behavior and model extension points.

The calculation model uses integer cents. Turnout is an input, not a prediction caused by a discount. Profit here means revenue minus the included cup and operating costs; taxes, financing and inventory changes are outside this lesson.

## AI use

AI assisted the implementation, tests and original scene illustrations. Financial assumptions are educational examples, not measured business data or forecasts.

## License

Application code and original scene illustrations: MIT (see LICENSE). Bundled fonts retain their SIL Open Font License files.

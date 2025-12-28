package main

import (
	"tmail/internal"

	"github.com/rs/zerolog/log"

	_ "tmail/docs"
)

// @title Tmail API
// @version 2.0.0
// @description API documentation for Tmail - Anonymous Temporary Email Service.
// @description Tmail provides a simple API to receive and manage temporary emails.

// @contact.name Tmail
// @contact.url https://github.com/sunls24/tmail

// @license.name MIT
// @license.url https://opensource.org/licenses/MIT

// @host localhost:3000
// @BasePath /api

// @tag.name Email
// @tag.description Email operations
// @tag.name Domain
// @tag.description Domain operations
// @tag.name Internal
// @tag.description Internal operations (used by Cloudflare Workers)

func main() {
	err := internal.NewApp().Run()
	if err != nil {
		log.Panic().Err(err).Send()
	}
}

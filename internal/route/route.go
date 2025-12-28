package route

import (
	"tmail/internal/api"

	"github.com/labstack/echo/v4"
	echoSwagger "github.com/swaggo/echo-swagger"
)

func Register(e *echo.Echo) {
	g := e.Group("/api")
	g.POST("/report", api.Wrap(api.Report))
	g.GET("/fetch", api.Wrap(api.Fetch))
	g.GET("/fetch/:id", api.Wrap(api.FetchDetail))
	g.GET("/fetch/latest", api.Wrap(api.FetchLatest))
	g.GET("/download/:id", api.Wrap(api.Download))
	g.GET("/domain", api.Wrap(api.DomainList))

	// Swagger API Documentation
	g.GET("/docs/*", echoSwagger.WrapHandler)
}

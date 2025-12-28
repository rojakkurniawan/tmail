package api

import "net/http"

// DomainList godoc
// @Summary Get available domains
// @Description Returns a list of available email domain suffixes
// @Tags Domain
// @Produce json
// @Success 200 {array} string "List of available domains"
// @Router /domain [get]
func DomainList(ctx *Context) error {
	return ctx.JSON(http.StatusOK, ctx.DomainList)
}

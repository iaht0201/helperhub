using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WebTimViec.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddMaxJobPosts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "MaxJobPosts",
                table: "ServicePackages",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MaxJobPosts",
                table: "ServicePackages");
        }
    }
}

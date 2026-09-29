using System.ComponentModel;
using System.Drawing;
using System.Windows.Forms;

namespace ECS;

public class WizardPicReviewForm : Form
{
	private IContainer components;

	private PictureBox From_PictureBox;

	protected override void Dispose(bool disposing)
	{
		if (disposing && components != null)
		{
			components.Dispose();
		}
		base.Dispose(disposing);
	}

	private void InitializeComponent()
	{
		this.From_PictureBox = new System.Windows.Forms.PictureBox();
		((System.ComponentModel.ISupportInitialize)this.From_PictureBox).BeginInit();
		base.SuspendLayout();
		this.From_PictureBox.Location = new System.Drawing.Point(2, 3);
		this.From_PictureBox.Name = "From_PictureBox";
		this.From_PictureBox.Size = new System.Drawing.Size(446, 332);
		this.From_PictureBox.TabIndex = 0;
		this.From_PictureBox.TabStop = false;
		this.From_PictureBox.MouseClick += new System.Windows.Forms.MouseEventHandler(WizardPicReviewForm_MouseClick);
		base.AutoScaleDimensions = new System.Drawing.SizeF(6f, 12f);
		base.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
		this.AutoScroll = true;
		base.ClientSize = new System.Drawing.Size(784, 462);
		base.Controls.Add(this.From_PictureBox);
		base.MaximizeBox = false;
		base.MinimizeBox = false;
		base.Name = "WizardPicReviewForm";
		base.ShowIcon = false;
		base.ShowInTaskbar = false;
		base.StartPosition = System.Windows.Forms.FormStartPosition.CenterParent;
		base.MouseClick += new System.Windows.Forms.MouseEventHandler(WizardPicReviewForm_MouseClick);
		((System.ComponentModel.ISupportInitialize)this.From_PictureBox).EndInit();
		base.ResumeLayout(false);
	}

	public WizardPicReviewForm(Image Pic)
	{
		InitializeComponent();
		From_PictureBox.Image = Pic;
		From_PictureBox.Size = new Size(From_PictureBox.Image.Size.Width + 5, From_PictureBox.Image.Size.Height + 5);
	}

	private void WizardPicReviewForm_MouseClick(object sender, MouseEventArgs e)
	{
		base.DialogResult = DialogResult.OK;
	}
}
